import { LoginForm } from '@/features/auth/LoginForm'
import { WashingMachine } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white">
            <WashingMachine className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Laundry Buddy</h1>
          <p className="text-sm text-gray-500">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
