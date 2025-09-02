import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signIn } from "@/services/auth"
import { useToast } from "@/components/ui/use-toast"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await signIn(email, password)

      if (response?.user) {
        addToast({
          title: "Login realizado",
          description: `Bem-vindo, ${response.user.name || "usuário"}!`,
        })

        // Se for admin
        if (response.user.role === "admin") {
          navigate("/admin")
        } else {
          navigate("/")
        }
      } else {
        addToast({
          title: "Erro no login",
          description: "Credenciais inválidas.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      addToast({
        title: "Erro no servidor",
        description: err.message || "Não foi possível realizar o login.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
