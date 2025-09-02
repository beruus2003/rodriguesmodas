import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Smartphone, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const cardFormSchema = z.object({
  cardNumber: z.string().min(13, 'Número do cartão inválido'),
  expiryMonth: z.string().min(1, 'Mês obrigatório'),
  expiryYear: z.string().min(1, 'Ano obrigatório'),
  securityCode: z.string().min(3, 'CVV inválido'),
  cardholderName: z.string().min(2, 'Nome obrigatório'),
  identificationType: z.string().min(1, 'Tipo de documento obrigatório'),
  identificationNumber: z.string().min(5, 'Número do documento obrigatório'),
  installments: z.string().min(1, 'Selecione as parcelas'),
  issuer: z.string().optional(),
});

const pixFormSchema = z.object({
  identificationType: z.string().min(1, 'Tipo de documento obrigatório'),
  identificationNumber: z.string().min(5, 'Número do documento obrigatório'),
});

interface PaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  status: string;
  secure_thumbnail: string;
  thumbnail: string;
  deferred_capture: string;
  settings: any[];
  additional_info_needed: string[];
}

interface CardIssuer {
  id: number;
  name: string;
  secure_thumbnail: string;
  thumbnail: string;
}

interface InstallmentOption {
  payment_method_id: string;
  payment_type_id: string;
  issuer: {
    id: number;
    name: string;
  };
  processing_mode: string;
  merchant_account_id?: string;
  payer_costs: Array<{
    installments: number;
    installment_rate: number;
    discount_rate: number;
    reimbursement_rate?: number;
    labels: string[];
    installment_rate_collector: string[];
    min_allowed_amount: number;
    max_allowed_amount: number;
    recommended_message: string;
    installment_amount: number;
    total_amount: number;
  }>;
}

declare global {
  interface Window {
    MercadoPago: any;
    mp: any;
  }
}

export function PaymentForm({ orderId, amount, onSuccess, onError }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'pix'>('credit_card');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [cardIssuers, setCardIssuers] = useState<CardIssuer[]>([]);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [cardToken, setCardToken] = useState<string>('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulários
  const cardForm = useForm<z.infer<typeof cardFormSchema>>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      securityCode: '',
      cardholderName: user?.name || '',
      identificationType: 'CPF',
      identificationNumber: '',
      installments: '1',
      issuer: '',
    },
  });

  const pixForm = useForm<z.infer<typeof pixFormSchema>>({
    resolver: zodResolver(pixFormSchema),
    defaultValues: {
      identificationType: 'CPF',
      identificationNumber: '',
    },
  });

  // Carregar SDK do Mercado Pago
  useEffect(() => {
    if (window.MercadoPago) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      window.mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);
      setSdkLoaded(true);
    };
    script.onerror = () => {
      console.error('Erro ao carregar SDK do Mercado Pago');
      onError('Erro ao carregar sistema de pagamentos');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  // Buscar métodos de pagamento
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['/api/payment/methods'],
    enabled: sdkLoaded,
  });

  useEffect(() => {
    if (paymentMethodsData && Array.isArray(paymentMethodsData)) {
      setPaymentMethods(paymentMethodsData.filter((method: PaymentMethod) => 
        method.payment_type_id === 'credit_card' || method.payment_type_id === 'debit_card'
      ));
    }
  }, [paymentMethodsData]);

  // Buscar emissores do cartão
  const fetchCardIssuers = async (paymentMethodId: string, bin: string) => {
    try {
      const response = await fetch(`/api/payment/card_issuers?payment_method_id=${paymentMethodId}&bin=${bin}`);
      const data = await response.json();
      setCardIssuers(data);
    } catch (error) {
      console.error('Erro ao buscar emissores:', error);
    }
  };

  // Buscar parcelas
  const fetchInstallments = async (paymentMethodId: string, amount: number, issuerId?: number) => {
    try {
      const url = `/api/payment/installments?payment_method_id=${paymentMethodId}&amount=${amount}${issuerId ? `&issuer_id=${issuerId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setInstallmentOptions(data);
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
    }
  };

  // Monitorar mudanças no número do cartão
  const cardNumber = cardForm.watch('cardNumber');
  const issuer = cardForm.watch('issuer');

  useEffect(() => {
    if (cardNumber && cardNumber.length >= 6 && selectedPaymentMethodId) {
      const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
      fetchCardIssuers(selectedPaymentMethodId, bin);
    }
  }, [cardNumber, selectedPaymentMethodId]);

  useEffect(() => {
    if (selectedPaymentMethodId && issuer) {
      fetchInstallments(selectedPaymentMethodId, amount, Number(issuer));
    }
  }, [selectedPaymentMethodId, issuer, amount]);

  // Criar token do cartão
  const createCardToken = async (cardData: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      window.mp.createCardToken({
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.expiryMonth,
        cardExpirationYear: cardData.expiryYear,
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber,
      }, (err: any, token: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(token.id);
        }
      });
    });
  };

  // Mutation para processar pagamento
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        body: JSON.stringify(paymentData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: any) => {
      console.error('Erro no pagamento:', error);
      onError(error.message || 'Erro ao processar pagamento');
    },
  });

  // Submit do formulário de cartão
  const onCardSubmit = async (data: z.infer<typeof cardFormSchema>) => {
    if (!user) {
      onError('Usuário não encontrado');
      return;
    }

    setProcessing(true);

    try {
      // Criar token do cartão
      const token = await createCardToken(data);
      
      // Processar pagamento
      const paymentData = {
        orderId,
        paymentMethod: paymentMethod,
        amount,
        payer: {
          email: user.email,
          first_name: user.name?.split(' ')[0] || 'Cliente',
          last_name: user.name?.split(' ').slice(1).join(' ') || 'Rodrigues Modas',
          identification: {
            type: data.identificationType,
            number: data.identificationNumber,
          },
        },
        cardData: {
          token,
          issuer_id: Number(data.issuer),
          payment_method_id: selectedPaymentMethodId,
          installments: Number(data.installments),
        },
      };

      await processPaymentMutation.mutateAsync(paymentData);
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      onError(error.message || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  // Submit do formulário PIX
  const onPixSubmit = async (data: z.infer<typeof pixFormSchema>) => {
    if (!user) {
      onError('Usuário não encontrado');
      return;
    }

    setProcessing(true);

    try {
      const paymentData = {
        orderId,
        paymentMethod: 'pix' as const,
        amount,
        payer: {
          email: user.email,
          first_name: user.name?.split(' ')[0] || 'Cliente',
          last_name: user.name?.split(' ').slice(1).join(' ') || 'Rodrigues Modas',
          identification: {
            type: data.identificationType,
            number: data.identificationNumber,
          },
        },
      };

      await processPaymentMutation.mutateAsync(paymentData);
    } catch (error: any) {
      console.error('Erro ao processar PIX:', error);
      onError(error.message || 'Erro ao processar PIX');
    } finally {
      setProcessing(false);
    }
  };

  if (!sdkLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando sistema de pagamentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de método de pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
          <CardDescription>
            Escolha como deseja pagar seu pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              type="button"
              variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
              className="h-16 flex-col"
              onClick={() => setPaymentMethod('credit_card')}
              data-testid="button-payment-credit"
            >
              <CreditCard className="h-6 w-6 mb-1" />
              <span>Cartão de Crédito</span>
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'debit_card' ? 'default' : 'outline'}
              className="h-16 flex-col"
              onClick={() => setPaymentMethod('debit_card')}
              data-testid="button-payment-debit"
            >
              <Smartphone className="h-6 w-6 mb-1" />
              <span>Cartão de Débito</span>
            </Button>
            <Button
              type="button"
              variant={paymentMethod === 'pix' ? 'default' : 'outline'}
              className="h-16 flex-col"
              onClick={() => setPaymentMethod('pix')}
              data-testid="button-payment-pix"
            >
              <QrCode className="h-6 w-6 mb-1" />
              <span>PIX</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de cartão */}
      {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
        <Card>
          <CardHeader>
            <CardTitle>
              Dados do {paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...cardForm}>
              <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
                {/* Seleção de bandeira do cartão */}
                <FormField
                  control={cardForm.control}
                  name="cardholderName"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <Select 
                        value={selectedPaymentMethodId} 
                        onValueChange={setSelectedPaymentMethodId}
                      >
                        <SelectTrigger data-testid="select-card-brand">
                          <SelectValue placeholder="Selecione a bandeira" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Número do cartão */}
                <FormField
                  control={cardForm.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Cartão</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          data-testid="input-card-number"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                            field.onChange(value);
                            
                            // Auto-detectar bandeira
                            if (value.length >= 6) {
                              const bin = value.replace(/\s/g, '').substring(0, 1);
                              const detectedMethod = paymentMethods.find(method => {
                                // Visa começa com 4
                                if (bin === '4' && method.id === 'visa') return true;
                                // Mastercard começa com 5
                                if (bin === '5' && method.id === 'master') return true;
                                // Elo pode começar com vários números
                                if (['4', '5', '6'].includes(bin) && method.id === 'elo') return true;
                                return false;
                              });
                              
                              if (detectedMethod) {
                                setSelectedPaymentMethodId(detectedMethod.id);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Mês de expiração */}
                  <FormField
                    control={cardForm.control}
                    name="expiryMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-expiry-month">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = (i + 1).toString().padStart(2, '0');
                              return (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ano de expiração */}
                  <FormField
                    control={cardForm.control}
                    name="expiryYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-expiry-year">
                              <SelectValue placeholder="AAAA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => {
                              const year = (new Date().getFullYear() + i).toString();
                              return (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* CVV */}
                <FormField
                  control={cardForm.control}
                  name="securityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123"
                          maxLength={4}
                          data-testid="input-cvv"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nome no cartão */}
                <FormField
                  control={cardForm.control}
                  name="cardholderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome no Cartão</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome completo" data-testid="input-cardholder-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo de documento */}
                  <FormField
                    control={cardForm.control}
                    name="identificationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-id-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número do documento */}
                  <FormField
                    control={cardForm.control}
                    name="identificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Documento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000.000.000-00" data-testid="input-id-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Banco emissor */}
                {cardIssuers.length > 0 && (
                  <FormField
                    control={cardForm.control}
                    name="issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco Emissor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-issuer">
                              <SelectValue placeholder="Selecione o banco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cardIssuers.map((issuer) => (
                              <SelectItem key={issuer.id} value={issuer.id.toString()}>
                                {issuer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Parcelas */}
                {installmentOptions.length > 0 && installmentOptions[0]?.payer_costs.length > 0 && (
                  <FormField
                    control={cardForm.control}
                    name="installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcelas</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-installments">
                              <SelectValue placeholder="Selecione as parcelas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {installmentOptions[0].payer_costs.map((cost) => (
                              <SelectItem key={cost.installments} value={cost.installments.toString()}>
                                {cost.recommended_message}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={processing}
                  data-testid="button-submit-card"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Pagar com Cartão'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Formulário PIX */}
      {paymentMethod === 'pix' && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>
              Após confirmar, você receberá um QR Code para pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...pixForm}>
              <form onSubmit={pixForm.handleSubmit(onPixSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo de documento */}
                  <FormField
                    control={pixForm.control}
                    name="identificationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pix-id-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número do documento */}
                  <FormField
                    control={pixForm.control}
                    name="identificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Documento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000.000.000-00" data-testid="input-pix-id-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O PIX tem validade de 30 minutos. Após confirmar, você receberá um QR Code para escanear no seu app do banco.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={processing}
                  data-testid="button-submit-pix"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    'Gerar PIX'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}