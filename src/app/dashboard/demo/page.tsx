import Dashboard from "@/components/primio/Dashboard";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Primio — Demo dashboard",robots:{index:false,follow:false}};
export default function DemoDashboardPage(){return <Dashboard demo/>;}