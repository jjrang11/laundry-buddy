import { ShieldOff } from 'lucide-react'
import { signOut } from '@/features/auth/auth.actions'
import { Button } from '@/components/ui/button'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center space-y-5">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
            <ShieldOff className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-gray-900">Shop Suspended</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your shop has been suspended. Please contact support to restore access.
          </p>
        </div>

        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
