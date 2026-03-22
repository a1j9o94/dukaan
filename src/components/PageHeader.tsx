interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b bg-card sticky top-0 z-40 shadow-sm">
      <h1 className="text-lg font-bold">{title}</h1>
      {action}
    </div>
  );
}
