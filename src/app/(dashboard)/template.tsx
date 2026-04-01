export default function DashboardTemplate({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="animate-in fade-in-0 duration-300">
      {children}
    </div>
  )
}
