export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-lg p-10">
        {children}
      </div>
    </div>
  );
}
