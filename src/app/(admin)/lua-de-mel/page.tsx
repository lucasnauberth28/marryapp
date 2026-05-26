// src/app/(admin)/lua-de-mel/page.tsx
import { getHoneymoonItems, createHoneymoonItem, deleteHoneymoonItem, toggleHoneymoonItemStatus } from "@/actions/honeymoon-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plane, MapPin, DollarSign, Palmtree } from "lucide-react"
import { NewHoneymoonItemModal } from "./new-item-modal"
import { verifyAdminSession } from "@/actions/auth-actions"

export default async function HoneymoonPage() {
  await verifyAdminSession()
  
  const items = await getHoneymoonItems()

  const totalCents = items.reduce((acc, item) => acc + item.amount, 0)
  const paidCents = items.filter(i => i.isPaid).reduce((acc, item) => acc + item.amount, 0)

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Palmtree className="w-8 h-8 text-emerald-500" />
            Lua de Mel
          </h2>
          <p className="text-zinc-500 mt-1">Planeje o roteiro, controle gastos e sonhe com o destino.</p>
        </div>
        <NewHoneymoonItemModal />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/3 -translate-y-1/4">
            <Palmtree className="w-48 h-48" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Estimativa Total</p>
                <h3 className="text-3xl font-bold mt-1">
                  {(totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shadow-sm border border-white/5">
                <MapPin className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/80 shadow-sm bg-white transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm font-medium">Total Pago</p>
                <h3 className="text-3xl font-bold text-zinc-900 mt-1">
                  {(paidCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/80 shadow-sm bg-white transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm font-medium">Itens Planejados</p>
                <h3 className="text-3xl font-bold text-zinc-900 mt-1">
                  {items.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                <Plane className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border border-zinc-200/80 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-zinc-50/80 backdrop-blur-sm">
              <TableRow className="border-zinc-100">
                <TableHead className="w-[300px] text-zinc-500 font-medium">Item</TableHead>
                <TableHead className="text-zinc-500 font-medium">Categoria</TableHead>
                <TableHead className="text-zinc-500 font-medium">Valor Estimado</TableHead>
                <TableHead className="text-zinc-500 font-medium">Status</TableHead>
                <TableHead className="w-10 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                      <div className="p-5 bg-zinc-50 rounded-full border border-zinc-100 shadow-inner">
                        <Plane className="w-8 h-8 text-zinc-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-zinc-600">Nenhum plano adicionado ainda</p>
                        <p className="text-sm">Comece adicionando seu primeiro destino ou reserva!</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-zinc-50/50 transition-colors border-zinc-100">
                    <TableCell className="font-medium text-zinc-900">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize font-normal text-zinc-600 bg-white shadow-sm border-zinc-200/60">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-700 font-medium">
                      {(item.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>
                      <form action={async () => {
                        'use server'
                        await toggleHoneymoonItemStatus(item.id, !item.isPaid)
                      }}>
                        <button type="submit" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full transition-transform active:scale-95">
                          {item.isPaid ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm font-medium cursor-pointer">Pago</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200 font-medium shadow-sm cursor-pointer">Pendente</Badge>
                          )}
                        </button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={async () => {
                        'use server'
                        await deleteHoneymoonItem(item.id)
                      }}>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}