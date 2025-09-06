import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Product, QuoteItem } from '@/types';
import { calculateQuoteItem } from '@/utils/calculations';

interface ProductSelectorProps {
  onProductSelect: (item: Omit<QuoteItem, 'id'>) => void;
  mode: 'unique' | 'mensuel';
}

const ProductSelector = ({ onProductSelect, mode }: ProductSelectorProps) => {
  const { settings } = useStore();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const filteredProducts = settings.catalog.filter(product => {
    if (!product.active) return false;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || product.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleProductSelect = (product: Product) => {
    const newItem: Omit<QuoteItem, 'id'> = {
      type: product.type,
      reference: product.reference,
      mode: mode,
      qty: 1,
      unitPriceValue: settings.priceInputModeDefault === 'HT' ? product.priceHT : product.priceTTC,
      unitPriceMode: settings.priceInputModeDefault,
      lineDiscountPct: undefined,
      puHT: undefined,
      puTTC: undefined,
      totalHT_brut: undefined,
      discountHT: undefined,
      totalHT_net: undefined,
      totalTTC: undefined
    };

    const calculatedItem = calculateQuoteItem(newItem as QuoteItem, settings.tvaPct, true);
    onProductSelect(calculatedItem);
    setOpen(false);
  };

  const formatPrice = (price: number) => {
    const symbol = settings.currency.symbol;
    return settings.currency.position === 'before' 
      ? `${symbol} ${price.toFixed(2)}`
      : `${price.toFixed(2)} ${symbol}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-secondary-light text-secondary hover:bg-secondary hover:text-secondary-foreground">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Choisir du catalogue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Sélectionner un produit</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {settings.types.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des produits */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedType !== 'all'
                    ? 'Aucun produit ne correspond aux critères de recherche'
                    : 'Aucun produit actif dans le catalogue'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProductSelect(product)}>
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">Réf: {product.reference}</p>
                            </div>
                            <Badge variant="outline">{product.type}</Badge>
                          </div>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">HT: {formatPrice(product.priceHT)}</p>
                              <p className="font-medium">TTC: {formatPrice(product.priceTTC)}</p>
                            </div>
                            <Button size="sm" className="bg-primary hover:bg-primary-hover">
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelector;