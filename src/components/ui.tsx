"use client";
import { cn } from "@/lib/utils";

export function Card({className, ...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm",className)} {...p}/> }
export function CardHeader({className, ...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={cn("p-5 pb-3",className)} {...p}/> }
export function CardContent({className, ...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={cn("p-5 pt-0",className)} {...p}/> }
export function Badge({variant="default", className, ...p}: React.HTMLAttributes<HTMLSpanElement> & {variant?: "default"|"success"|"warning"|"danger"|"neutral"|"outline"}){
  const m = {
    default:"bg-slate-900 text-white",
    success:"bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning:"bg-amber-50 text-amber-700 border border-amber-200",
    danger:"bg-red-50 text-red-700 border border-red-200",
    neutral:"bg-slate-100 text-slate-700 border border-slate-200",
    outline:"bg-white text-slate-700 border border-slate-200",
  }[variant];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",m,className)} {...p}/>
}
export function Button({variant="primary", size="md", className, ...p}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: "primary"|"ghost"|"outline"|"secondary", size?:"sm"|"md"|"lg"}){
  const v = {
    primary:"bg-[#ff4d11] hover:bg-[#e6430c] text-white shadow-sm",
    secondary:"bg-slate-900 hover:bg-slate-800 text-white",
    outline:"bg-white border border-slate-200 hover:bg-slate-50 text-slate-700",
    ghost:"hover:bg-slate-100 text-slate-700",
  }[variant];
  const s = {sm:"h-8 px-3 text-xs", md:"h-9 px-4 text-sm", lg:"h-10 px-5 text-sm"}[size];
  return <button className={cn("inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50",v,s,className)} {...p}/>
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={cn("h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11]",props.className)} />
}
