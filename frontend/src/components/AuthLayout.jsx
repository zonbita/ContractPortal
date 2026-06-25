import { FileText } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-primary-dark p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <FileText size={22} />
          </div>
          <span className="text-xl font-semibold">Contract Portal</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-snug">Quản lý hợp đồng thông minh</h2>
          <p className="mt-4 max-w-md text-white/80">
            Lưu trữ hợp đồng, theo dõi trạng thái, nhắc nhở gia hạn và quản lý khách hàng — tất cả trong một nền tảng.
          </p>
        </div>
        <p className="text-sm text-white/60">© Contract Portal MVP</p>
      </div>

      <div className="flex w-full flex-col justify-center bg-body-bg px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
              <FileText className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-heading">Contract Portal</h1>
          </div>
          <div className="card p-8">
            <h1 className="text-2xl font-semibold text-heading">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
