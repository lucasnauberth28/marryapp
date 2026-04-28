// src/app/(admin)/lua-de-mel/page.tsx
import { getHoneymoonItems, createHoneymoonItem, deleteHoneymoonItem } from "@/actions/honeymoon-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plane } from "lucide-react"

export default async function HoneymoonPage() {
  const items = await getHoneymoonItems()
  const totalCents = items.reduce((acc, item) => acc + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Planejamento da Lua de Mel</h2>
          <p className="text-zinc-500 text-sm">Gerencie os custos e roteiros da sua viagem.</p>
        </div>
        
        {/* Formulário Simples de Inserção Inline */}
        <Card className="p-2 border-zinc-200 bg-white">
          <form action={createHoneymoonItem} className="flex gap-2">
            <Input name="title" placeholder="Item (ex: Hotel)" className="w-48" required />
            <Input name="category" placeholder="Categoria" className="w-32" required />
            <Input name="amount" type="number" step="0.01" placeholder="R$ 0,00" className="w-28" required />
            <Button type="submit" size="sm">Adicionar</Button>
          </form>
        </Card>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-zinc-500">Estimativa Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Itens */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor Estimado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-400">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Nenhum plano cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {(item.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    {item.isPaid ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pago</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <form action={async () => {
                      'use server'
                      await deleteHoneymoonItem(item.id)
                    }}>
                      <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600">
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
  )
}