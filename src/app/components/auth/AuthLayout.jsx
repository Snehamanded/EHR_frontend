import { Stethoscope } from 'lucide-react';

export function AuthLayout({ children, title, subtitle, wide = false }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Medora EHR</h1>
          <p className="text-base text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {/* Content */}
        <div className={`${wide ? 'w-full max-w-6xl' : 'max-w-md'} mx-auto flex-1 flex flex-col min-h-0`}>
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-gray-500 flex-shrink-0">
          <p>© {new Date().getFullYear()} Medora Healthcare. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}