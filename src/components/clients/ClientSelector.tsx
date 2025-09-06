import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

interface ClientSelectorProps {
  value?: string;
  onSelect: (client: Client | null) => void;
  placeholder?: string;
}

const ClientSelector = ({ value, onSelect, placeholder = "Sélectionner un client..." }: ClientSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find(c => c.id === value);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [value, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Grouper les clients par première lettre
  const groupedClients = clients.reduce((acc, client) => {
    const firstLetter = client.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(client);
    return acc;
  }, {} as Record<string, Client[]>);

  const sortedLetters = Object.keys(groupedClients).sort();

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    onSelect(client);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    onSelect(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? (
            <div className="flex items-center space-x-2">
              {selectedClient.company ? (
                <Building2 className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
              <span className="truncate">
                {selectedClient.name}
                {selectedClient.company && (
                  <span className="text-muted-foreground ml-1">
                    - {selectedClient.company}
                  </span>
                )}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandList>
            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
            
            {selectedClient && (
              <CommandGroup>
                <CommandItem onSelect={handleClear}>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span>Effacer la sélection</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
            
            {sortedLetters.map(letter => (
              <CommandGroup key={letter} heading={letter}>
                {groupedClients[letter].map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.name} ${client.company || ''} ${client.email || ''}`}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center space-x-2">
                      {client.company ? (
                        <Building2 className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        {client.company && (
                          <span className="text-sm text-muted-foreground">
                            {client.company}
                          </span>
                        )}
                        {client.email && (
                          <span className="text-xs text-muted-foreground">
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ClientSelector;