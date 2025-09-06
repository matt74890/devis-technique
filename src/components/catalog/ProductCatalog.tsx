import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload, Search, Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Product } from '@/types';

const ProductCatalog = () => {
  const { settings, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    reference: '',
    name: '',
    description: '',
    type: '',
    priceHT: 0,
    priceTTC: 0,
    imageUrl: '',
    active: true,
    tags: []
  });

  const filteredProducts = settings.catalog.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || product.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.reference) return;

    const productToSave: Omit<Product, 'id'> = {
      reference: newProduct.reference!,
      name: newProduct.name!,
      description: newProduct.description || '',
      type: newProduct.type || settings.types[0],
      priceHT: newProduct.priceHT || 0,
      priceTTC: newProduct.priceTTC || 0,
      imageUrl: newProduct.imageUrl,
      active: newProduct.active ?? true,
      tags: newProduct.tags || []
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productToSave);
    } else {
      addProduct(productToSave);
    }

    setNewProduct({
      reference: '',
      name: '',
      description: '',
      type: '',
      priceHT: 0,
      priceTTC: 0,
      imageUrl: '',
      active: true,
      tags: []
    });
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
  };

  const calculatePrice = (price: number, isHT: boolean) => {
    const tvaMultiplier = 1 + (settings.tvaPct / 100);
    if (isHT) {
      return {
        priceHT: price,
        priceTTC: price * tvaMultiplier
      };
    } else {
      return {
        priceHT: price / tvaMultiplier,
        priceTTC: price
      };
    }
  };

  const formatPrice = (price: number) => {
    const symbol = settings.currency.symbol;
    return settings.currency.position === 'before' 
      ? `${symbol} ${price.toFixed(2)}`
      : `${price.toFixed(2)} ${symbol}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Catalogue de Produits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="">Tous les types</SelectItem>
                {settings.types.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'ajout/édition */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence *</Label>
              <Input
                id="reference"
                value={newProduct.reference}
                onChange={(e) => setNewProduct({ ...newProduct, reference: e.target.value })}
                placeholder="REF-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Nom du produit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newProduct.type}
                onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {settings.types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceHT">Prix HT</Label>
              <Input
                id="priceHT"
                type="number"
                step="0.01"
                value={newProduct.priceHT}
                onChange={(e) => {
                  const prices = calculatePrice(parseFloat(e.target.value) || 0, true);
                  setNewProduct({ ...newProduct, ...prices });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceTTC">Prix TTC</Label>
              <Input
                id="priceTTC"
                type="number"
                step="0.01"
                value={newProduct.priceTTC}
                onChange={(e) => {
                  const prices = calculatePrice(parseFloat(e.target.value) || 0, false);
                  setNewProduct({ ...newProduct, ...prices });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l'image</Label>
              <div className="flex space-x-2">
                <Input
                  id="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Description détaillée du produit"
              rows={3}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={newProduct.active}
                onCheckedChange={(checked) => setNewProduct({ ...newProduct, active: checked })}
              />
              <Label htmlFor="active">Produit actif</Label>
            </div>
            
            <div className="flex space-x-2">
              {editingProduct && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      reference: '',
                      name: '',
                      description: '',
                      type: '',
                      priceHT: 0,
                      priceTTC: 0,
                      imageUrl: '',
                      active: true,
                      tags: []
                    });
                  }}
                >
                  Annuler
                </Button>
              )}
              <Button onClick={handleSaveProduct} className="bg-success hover:bg-success/90">
                {editingProduct ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {!product.active && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive">Inactif</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
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
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedType 
                ? 'Aucun produit ne correspond aux critères de recherche'
                : 'Aucun produit dans le catalogue. Ajoutez votre premier produit ci-dessus.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductCatalog;