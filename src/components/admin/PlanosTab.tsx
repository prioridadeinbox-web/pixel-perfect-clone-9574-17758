import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PlanosTab = () => {
  const [planos, setPlanos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome_plano: "",
    descricao: "",
    preco: 0,
  });

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    const { data } = await supabase
      .from("planos")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setPlanos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlano) {
        const { error } = await supabase
          .from("planos")
          .update(formData)
          .eq("id", editingPlano.id);
        
        if (error) throw error;
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("planos")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }
      
      setOpen(false);
      setFormData({ nome_plano: "", descricao: "", preco: 0 });
      setEditingPlano(null);
      loadPlanos();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (plano: any) => {
    setEditingPlano(plano);
    setFormData({
      nome_plano: plano.nome_plano,
      descricao: plano.descricao || "",
      preco: parseFloat(plano.preco),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    
    try {
      const { error } = await supabase
        .from("planos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Plano excluído com sucesso!");
      loadPlanos();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPlano(null); setFormData({ nome_plano: "", descricao: "", preco: 0 }); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlano ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome do Plano</Label>
                <Input
                  value={formData.nome_plano}
                  onChange={(e) => setFormData({ ...formData, nome_plano: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planos.map((plano) => (
            <TableRow key={plano.id}>
              <TableCell>{plano.nome_plano}</TableCell>
              <TableCell>{plano.descricao || "-"}</TableCell>
              <TableCell>R$ {parseFloat(plano.preco).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(plano)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(plano.id)}>
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

export default PlanosTab;
