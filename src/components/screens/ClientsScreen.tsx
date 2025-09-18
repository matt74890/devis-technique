import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Client {
  id: string;
  user_id?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

const ClientsScreen = () => {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France'
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erreur lors du chargement des clients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour créer un client');
      return;
    }
    
    if (!formData.name?.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast.success('Client modifié avec succès');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...formData, user_id: user.id, name: formData.name! });
        
        if (error) throw error;
        toast.success('Client créé avec succès');
      }
      
      fetchClients();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success('Client supprimé avec succès');
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'France'
    });
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsDialogOpen(true);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper les clients par première lettre
  const groupedClients = filteredClients.reduce((acc, client) => {
    const firstLetter = client.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(client);
    return acc;
  }, {} as Record<string, Client[]>);

  const sortedLetters = Object.keys(groupedClients).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Authentification requise
          </h3>
          <p className="text-muted-foreground">
            Vous devez vous connecter pour gérer vos clients
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Clients</h2>
          <p className="text-muted-foreground">Gérez vos clients et leurs informations</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre base de données'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Adresse complète"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ville"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    placeholder="Code postal"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    placeholder="Pays"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingClient ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des clients groupée par lettre */}
      <div className="space-y-6">
        {sortedLetters.map(letter => (
          <div key={letter}>
            <h3 className="text-lg font-semibold text-primary mb-3 flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                {letter}
              </div>
              {letter}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedClients[letter].map(client => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>{client.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {client.company && (
                        <p><strong>Entreprise:</strong> {client.company}</p>
                      )}
                      {client.email && (
                        <p><strong>Email:</strong> {client.email}</p>
                      )}
                      {client.phone && (
                        <p><strong>Tél:</strong> {client.phone}</p>
                      )}
                      {client.city && (
                        <p><strong>Ville:</strong> {client.city}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              {searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Essayez un autre terme de recherche' : 'Commencez par créer votre premier client'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsScreen;