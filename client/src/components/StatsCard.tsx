import { ReactNode } from "react";
import clsx from "clsx";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, icon, trend, trendUp, className, onClick }: StatsCardProps) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "bg-card rounded-2xl p-6 border border-border/50 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md group",
        onClick && "cursor-pointer hover:border-primary/50 hover:-translate-y-1",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150 group-hover:scale-125 duration-500">
        {icon}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          {icon}
        </div>
        {trend && (
          <div className={clsx("text-xs font-semibold px-2 py-1 rounded-full", 
            trendUp ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
