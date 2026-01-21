import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OrgPerson, CardSize } from '@/types/organogram';
import { useSectors } from '@/hooks/useSectors';
import { useUploadAvatar, useUpdatePerson, useCreatePerson, useDeletePerson } from '@/hooks/useOrganogram';
import { User, Upload, Trash2 } from 'lucide-react';

interface PersonDialogProps {
  person: OrgPerson | null;
  isOpen: boolean;
  onClose: () => void;
  isCreating?: boolean;
  defaultPosition?: { x: number; y: number };
}

export function PersonDialog({
  person,
  isOpen,
  onClose,
  isCreating = false,
  defaultPosition = { x: 100, y: 100 },
}: PersonDialogProps) {
  const { data: sectors } = useSectors();
  const uploadAvatar = useUploadAvatar();
  const updatePerson = useUpdatePerson();
  const createPerson = useCreatePerson();
  const deletePerson = useDeletePerson();

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    sector_id: '',
    card_size: 'medium' as CardSize,
    fill_card: false,
    locked: false,
    avatar_url: null as string | null,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name,
        role: person.role,
        sector_id: person.sector_id || '',
        card_size: person.card_size,
        fill_card: person.fill_card,
        locked: person.locked,
        avatar_url: person.avatar_url,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        sector_id: sectors?.[0]?.id || '',
        card_size: 'medium',
        fill_card: false,
        locked: false,
        avatar_url: null,
      });
    }
  }, [person, sectors, isOpen]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (person) {
      const url = await uploadAvatar.mutateAsync({ file, personId: person.id });
      setFormData(prev => ({ ...prev, avatar_url: url }));
      await updatePerson.mutateAsync({ id: person.id, avatar_url: url });
    } else {
      // For new person, we'll upload after creation
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (isCreating) {
      await createPerson.mutateAsync({
        name: formData.name,
        role: formData.role,
        sector: sectors?.find(s => s.id === formData.sector_id)?.name || 'Geral',
        sector_id: formData.sector_id || null,
        card_size: formData.card_size,
        fill_card: formData.fill_card,
        locked: formData.locked,
        avatar_url: null,
        position_x: defaultPosition.x,
        position_y: defaultPosition.y,
      });
    } else if (person) {
      await updatePerson.mutateAsync({
        id: person.id,
        name: formData.name,
        role: formData.role,
        sector: sectors?.find(s => s.id === formData.sector_id)?.name || 'Geral',
        sector_id: formData.sector_id || null,
        card_size: formData.card_size,
        fill_card: formData.fill_card,
        locked: formData.locked,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (person) {
      await deletePerson.mutateAsync(person.id);
      onClose();
    }
  };

  const selectedSector = sectors?.find(s => s.id === formData.sector_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Nova Pessoa' : 'Editar Pessoa'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 hover:border-primary transition-colors">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da pessoa"
            />
          </div>

          {/* Role */}
          <div className="grid gap-2">
            <Label htmlFor="role">Cargo</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Cargo ou função"
            />
          </div>

          {/* Sector */}
          <div className="grid gap-2">
            <Label>Setor</Label>
            <Select
              value={formData.sector_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sector_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors?.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      {sector.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card Size */}
          <div className="grid gap-2">
            <Label>Tamanho do Card</Label>
            <Select
              value={formData.card_size}
              onValueChange={(value) => setFormData(prev => ({ ...prev, card_size: value as CardSize }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <Label htmlFor="fill-card">Preencher card com cor</Label>
            <Switch
              id="fill-card"
              checked={formData.fill_card}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fill_card: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="locked">Bloquear posição</Label>
            <Switch
              id="locked"
              checked={formData.locked}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, locked: checked }))}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {!isCreating && person && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.role}>
              {isCreating ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
