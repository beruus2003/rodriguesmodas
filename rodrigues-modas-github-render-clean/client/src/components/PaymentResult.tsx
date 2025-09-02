import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Clock, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentResultProps {
  paymentData: {
    success: boolean;
    paymentId: string;
    status: string;
    statusDetail: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  };
  onClose: () => void;
}

const statusMessages = {
  approved: {
    title: 'Pagamento Aprovado!',
    description: 'Seu pagamento foi processado com sucesso.',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  pending: {
    title: 'Pagamento Pendente',
    description: 'Aguardando confirmação do pagamento.',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  rejected: {
    title: 'Pagamento Rejeitado',
    description: 'Não foi possível processar seu pagamento.',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  cancelled: {
    title: 'Pagamento Cancelado',
    description: 'O pagamento foi cancelado.',
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

export function PaymentResult({ paymentData, onClose }: PaymentResultProps) {
  const [currentStatus, setCurrentStatus] = useState(paymentData.status);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const statusInfo = statusMessages[currentStatus as keyof typeof statusMessages] || statusMessages.pending;
  const Icon = statusInfo.icon;

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentData.paymentId) return;

    setIsChecking(true);
    try {
      const response = await fetch(`/api/payment/${paymentData.paymentId}/status`);
      const data = await response.json();
      setCurrentStatus(data.status);
      
      if (data.status !== currentStatus) {
        toast({
          title: 'Status atualizado',
          description: `Status do pagamento: ${data.status}`,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-verificar status para pagamentos pendentes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStatus === 'pending') {
      interval = setInterval(checkPaymentStatus, 5000); // Verificar a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus, paymentData.paymentId]);

  // Copiar código PIX
  const copyPixCode = async () => {
    if (!paymentData.qrCode) return;

    try {
      await navigator.clipboard.writeText(paymentData.qrCode);
      toast({
        title: 'Código copiado!',
        description: 'O código PIX foi copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className={`flex items-center gap-3 ${statusInfo.color}`}>
            <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
              <CardDescription className="text-base">
                {statusInfo.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ID do pagamento */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">ID do Pagamento:</span>
              <span className="font-mono">{paymentData.paymentId}</span>
            </div>

            {/* Status detalhado */}
            {paymentData.statusDetail && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Detalhes:</span>
                <span className="text-right">{paymentData.statusDetail}</span>
              </div>
            )}

            <Separator />

            {/* Botão de atualizar status */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={checkPaymentStatus}
                disabled={isChecking}
                data-testid="button-check-status"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Verificando...' : 'Verificar Status'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code PIX */}
      {paymentData.qrCodeBase64 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento PIX</CardTitle>
            <CardDescription>
              Escaneie o QR Code ou copie o código para pagar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img
                  src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                  data-testid="img-qr-code"
                />
              </div>
            </div>

            {/* Código PIX para copiar */}
            {paymentData.qrCode && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ou copie o código PIX:
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md">
                    <code className="text-xs break-all" data-testid="text-pix-code">
                      {paymentData.qrCode}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPixCode}
                    data-testid="button-copy-pix"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Link do ticket */}
            {paymentData.ticketUrl && (
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(paymentData.ticketUrl, '_blank')}
                  data-testid="button-ticket-url"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Comprovante
                </Button>
              </div>
            )}

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                O PIX tem validade de 30 minutos. Após esse período, será necessário gerar um novo código.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Instruções baseadas no status */}
      <Card>
        <CardContent className="pt-6">
          {currentStatus === 'approved' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Pagamento confirmado!</strong><br />
                Seu pedido está sendo processado e você receberá uma confirmação por email.
              </AlertDescription>
            </Alert>
          )}

          {currentStatus === 'pending' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Aguardando pagamento.</strong><br />
                {paymentData.qrCode 
                  ? 'Efetue o pagamento PIX para confirmar seu pedido.'
                  : 'Seu pagamento está sendo processado. Aguarde a confirmação.'
                }
              </AlertDescription>
            </Alert>
          )}

          {currentStatus === 'rejected' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Pagamento não aprovado.</strong><br />
                Verifique os dados do seu cartão e tente novamente, ou escolha outro método de pagamento.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 flex justify-center">
            <Button onClick={onClose} data-testid="button-close-result">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}