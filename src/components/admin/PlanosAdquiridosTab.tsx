import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ActivityLogger } from "@/lib/activityLogger";

const PlanosAdquiridosTab = () => {
  const [planosAdquiridos, setPlanosAdquiridos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"id_carteira" | "status_plano" | "created_at">("id_carteira");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState<{
    cliente_id: string;
    plano_id: string;
    status_plano: "ativo" | "eliminado" | "pausado" | "segunda_chance" | "sim_rem" | "teste_1" | "teste_2";
    tipo_saque: "mensal" | "quinzenal";
    id_carteira: string;
  }>({
    cliente_id: "",
    plano_id: "",
    status_plano: "ativo",
    tipo_saque: "mensal",
    id_carteira: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: pa }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("planos_adquiridos").select(`
        *,
        profiles:cliente_id(nome, email),
        planos:plano_id(nome_plano)
      `).order("id_carteira", { ascending: true }),
      supabase.from("profiles").select("*").order("nome"),
      supabase.from("planos").select("*").order("nome_plano"),
    ]);
    
    if (pa) setPlanosAdquiridos(pa);
    if (c) setClientes(c);
    if (p) setPlanos(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.cliente_id) {
      toast.error("Selecione um cliente");
      return;
    }
    
    if (!formData.plano_id) {
      toast.error("Selecione um plano");
      return;
    }
    
    try {
      if (editingPlano) {
        const { error } = await supabase
          .from("planos_adquiridos")
          .update({
            plano_id: formData.plano_id,
            status_plano: formData.status_plano,
            tipo_saque: formData.tipo_saque
          })
          .eq("id", editingPlano.id);
        
        if (error) throw error;
        await ActivityLogger.logPlanoUpdated(editingPlano.id, formData);
        toast.success("Plano atualizado com sucesso!");
      } else {
        // Buscar o próximo ID de carteira sequencial para o trader
        const { data: existingPlans } = await supabase
          .from("planos_adquiridos")
          .select("id_carteira")
          .eq("cliente_id", formData.cliente_id)
          .order("created_at", { ascending: false });

        let nextId = 1;
        if (existingPlans && existingPlans.length > 0) {
          const lastId = existingPlans[0].id_carteira;
          const numericPart = parseInt(lastId);
          if (!isNaN(numericPart)) {
            nextId = numericPart + 1;
          }
        }

        const id_carteira = String(nextId).padStart(3, '0');

        const { error } = await supabase
          .from("planos_adquiridos")
          .insert([{
            cliente_id: formData.cliente_id,
            plano_id: formData.plano_id,
            status_plano: formData.status_plano,
            tipo_saque: formData.tipo_saque,
            id_carteira
          }]);
        
        if (error) throw error;
        await ActivityLogger.logPlanoCreated({ ...formData, id_carteira });
        toast.success(`Plano adquirido criado com ID de carteira: ${id_carteira}`);
      }
      
      setOpen(false);
      setFormData({ cliente_id: "", plano_id: "", status_plano: "ativo", tipo_saque: "mensal", id_carteira: "" });
      setEditingPlano(null);
      setClienteOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (plano: any) => {
    setEditingPlano(plano);
    setFormData({
      cliente_id: plano.cliente_id,
      plano_id: plano.plano_id,
      status_plano: plano.status_plano,
      tipo_saque: plano.tipo_saque,
      id_carteira: plano.id_carteira,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano adquirido?")) return;
    
    try {
      const { error } = await supabase
        .from("planos_adquiridos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      await ActivityLogger.logPlanoDeleted(id);
      toast.success("Plano excluído com sucesso!");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };


  const getStatusBadge = (status: string) => {
    const colors: any = {
      eliminado: "destructive",
      segunda_chance: "secondary",
      ativo: "default",
      pausado: "outline",
    };
    return <Badge variant={colors[status] || "default"}>{status}</Badge>;
  };

  // Apply filters and sorting
  const filteredAndSortedPlanos = planosAdquiridos
    .filter(plano => statusFilter === "all" ? true : plano.status_plano === statusFilter)
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === "id_carteira") {
        aValue = a.id_carteira;
        bValue = b.id_carteira;
      } else if (sortBy === "status_plano") {
        aValue = a.status_plano;
        bValue = b.status_plano;
      } else {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Gerenciar Planos Adquiridos</h2>
        
        {/* Filters and sorting */}
        <div className="flex gap-2 items-center flex-1 max-w-2xl">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="eliminado">Eliminado</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="segunda_chance">Segunda Chance</SelectItem>
              <SelectItem value="sim_rem">Sim Rem</SelectItem>
              <SelectItem value="teste_1">Teste 1</SelectItem>
              <SelectItem value="teste_2">Teste 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id_carteira">ID Carteira</SelectItem>
              <SelectItem value="status_plano">Status</SelectItem>
              <SelectItem value="created_at">Data de criação</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setFormData({ cliente_id: "", plano_id: "", status_plano: "ativo", tipo_saque: "mensal", id_carteira: "" });
            setEditingPlano(null);
            setClienteOpen(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              type="button"
              onClick={() => { 
                setEditingPlano(null); 
                setFormData({ cliente_id: "", plano_id: "", status_plano: "ativo", tipo_saque: "mensal", id_carteira: "" });
                setClienteOpen(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Atribuir Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlano ? "Editar Plano Adquirido" : "Novo Plano Adquirido"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clienteOpen}
                      className="w-full justify-between"
                      disabled={!!editingPlano}
                    >
                      {formData.cliente_id
                        ? clientes.find((c) => c.id === formData.cliente_id)?.nome
                        : "Selecione um cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background z-50">
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Buscar por nome ou email..." />
                      <CommandList className="max-h-[250px] overflow-y-auto">

                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.nome} ${c.email}`}
                              onSelect={() => {
                                setFormData({ ...formData, cliente_id: c.id });
                                setClienteOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.cliente_id === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{c.nome}</span>
                                <span className="text-xs text-muted-foreground">{c.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Plano</Label>
                <Select value={formData.plano_id} onValueChange={(value) => setFormData({ ...formData, plano_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome_plano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status_plano} onValueChange={(value: any) => setFormData({ ...formData, status_plano: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="eliminado">Eliminado</SelectItem>
                    <SelectItem value="segunda_chance">Segunda Chance</SelectItem>
                    <SelectItem value="teste_1">Teste 1</SelectItem>
                    <SelectItem value="teste_2">Teste 2</SelectItem>
                    <SelectItem value="sim_rem">Sim. Rem.</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Saque</Label>
                <Select value={formData.tipo_saque} onValueChange={(value: any) => setFormData({ ...formData, tipo_saque: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingPlano && (
                <div>
                  <Label>ID da Carteira</Label>
                  <Input
                    value={formData.id_carteira}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">ID da carteira é gerado automaticamente</p>
                </div>
              )}
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>ID Carteira</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo Saque</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedPlanos.map((pa) => (
            <TableRow key={pa.id}>
              <TableCell>{pa.profiles?.nome || "-"}</TableCell>
              <TableCell>{pa.planos?.nome_plano || "-"}</TableCell>
              <TableCell>{pa.id_carteira}</TableCell>
              <TableCell>{getStatusBadge(pa.status_plano)}</TableCell>
              <TableCell>{pa.tipo_saque}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(pa)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(pa.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanosAdquiridosTab;
