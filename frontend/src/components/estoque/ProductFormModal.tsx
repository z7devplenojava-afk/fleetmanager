import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/services/productService';
import { unitService } from '@/services/unitService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  loading?: boolean;
}

export function ProductFormModal({ isOpen, onClose, product, onSave, loading }: ProductFormModalProps) {
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    code: '',
    barcode: '',
    category: '',
    brand: '',
    model: '',
    unit: 'UN',
    costPrice: 0,
    salePrice: 0,
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    status: 'ACTIVE',
    location: '',
    supplier: '',
    shelfLife: '',
    weight: 0,
    weightUnit: 'KG',
    dimensions: '',
    storageConditions: '',
    notes: '',
    unitId: '',
    averageConsumption: 0,
    consumptionPeriod: 'DAILY',
    safetyStock: 0,
    leadTime: 7,
    abcClassification: 'C',
    turnoverRate: 0,
    daysOfInventory: 0,
    // Campos para variações de produtos
    size: '',
    color: '',
    productType: '',
    footwearSize: '',
    clothingSize: '',
    beltSize: '',
    material: '',
    style: '',
    gender: '',
    season: '',
  });

  useEffect(() => {
    loadUnits();
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        code: product.code || '',
        barcode: product.barcode || '',
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        unit: product.unit || 'UN',
        costPrice: product.costPrice || 0,
        salePrice: product.salePrice || 0,
        currentStock: product.currentStock || 0,
        minimumStock: product.minimumStock || 0,
        maximumStock: product.maximumStock || 0,
        reorderPoint: product.reorderPoint || 0,
        status: product.status || 'ACTIVE',
        location: product.location || '',
        supplier: product.supplier || '',
        shelfLife: product.shelfLife || '',
        weight: product.weight || 0,
        weightUnit: product.weightUnit || 'KG',
        dimensions: product.dimensions || '',
        storageConditions: product.storageConditions || '',
        notes: product.notes || '',
        unitId: product.unitId || '',
        averageConsumption: product.averageConsumption || 0,
        consumptionPeriod: product.consumptionPeriod || 'DAILY',
        safetyStock: product.safetyStock || 0,
        leadTime: product.leadTime || 7,
        abcClassification: product.abcClassification || 'C',
        turnoverRate: product.turnoverRate || 0,
        daysOfInventory: product.daysOfInventory || 0,
        // Campos para variações de produtos
        size: product.size || '',
        color: product.color || '',
        productType: product.productType || '',
        footwearSize: product.footwearSize || '',
        clothingSize: product.clothingSize || '',
        beltSize: product.beltSize || '',
        material: product.material || '',
        style: product.style || '',
        gender: product.gender || '',
        season: product.season || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        code: '',
        barcode: '',
        category: '',
        brand: '',
        model: '',
        unit: 'UN',
        costPrice: 0,
        salePrice: 0,
        currentStock: 0,
        minimumStock: 0,
        maximumStock: 0,
        reorderPoint: 0,
        status: 'ACTIVE',
        location: '',
        supplier: '',
        shelfLife: '',
        weight: 0,
        weightUnit: 'KG',
        dimensions: '',
        storageConditions: '',
        notes: '',
        unitId: '',
        averageConsumption: 0,
        consumptionPeriod: 'DAILY',
        safetyStock: 0,
        leadTime: 7,
        abcClassification: 'C',
        turnoverRate: 0,
        daysOfInventory: 0,
        // Campos para variações de produtos
        size: '',
        color: '',
        productType: '',
        footwearSize: '',
        clothingSize: '',
        beltSize: '',
        material: '',
        style: '',
        gender: '',
        season: '',
      });
    }
  }, [product, isOpen]);

  const loadUnits = async () => {
    try {
      const unitsData = await unitService.getAllUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const handleInputChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast({
        title: "Sucesso",
        description: product ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'LOW': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-yellow-100 text-yellow-800';
      case 'REORDER': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getAbcColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome do produto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Código interno"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Código de barras"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Categoria"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Marca"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Modelo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="L">Litro (L)</SelectItem>
                      <SelectItem value="M">Metro (M)</SelectItem>
                      <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                      <SelectItem value="CX">Caixa (CX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                      <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abcClassification">Classificação ABC</Label>
                  <Select value={formData.abcClassification} onValueChange={(value) => handleInputChange('abcClassification', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - Alto Valor</SelectItem>
                      <SelectItem value="B">B - Médio Valor</SelectItem>
                      <SelectItem value="C">C - Baixo Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Estoque */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Controle de Estoque</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Estoque Atual</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    value={formData.currentStock}
                    onChange={(e) => handleInputChange('currentStock', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    step="0.01"
                    value={formData.minimumStock}
                    onChange={(e) => handleInputChange('minimumStock', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maximumStock">Estoque Máximo</Label>
                  <Input
                    id="maximumStock"
                    type="number"
                    step="0.01"
                    value={formData.maximumStock}
                    onChange={(e) => handleInputChange('maximumStock', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Ponto de Reposição</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    step="0.01"
                    value={formData.reorderPoint}
                    onChange={(e) => handleInputChange('reorderPoint', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyStock">Estoque de Segurança</Label>
                  <Input
                    id="safetyStock"
                    type="number"
                    step="0.01"
                    value={formData.safetyStock}
                    onChange={(e) => handleInputChange('safetyStock', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageConsumption">Consumo Médio</Label>
                  <Input
                    id="averageConsumption"
                    type="number"
                    step="0.01"
                    value={formData.averageConsumption}
                    onChange={(e) => handleInputChange('averageConsumption', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumptionPeriod">Período de Consumo</Label>
                  <Select value={formData.consumptionPeriod} onValueChange={(value) => handleInputChange('consumptionPeriod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadTime">Tempo de Reposição (dias)</Label>
                  <Input
                    id="leadTime"
                    type="number"
                    value={formData.leadTime}
                    onChange={(e) => handleInputChange('leadTime', parseInt(e.target.value) || 0)}
                    placeholder="7"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Localização no estoque"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações Financeiras</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preço de Custo</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preço de Venda</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => handleInputChange('salePrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnoverRate">Taxa de Giro</Label>
                  <Input
                    id="turnoverRate"
                    type="number"
                    step="0.01"
                    value={formData.turnoverRate}
                    onChange={(e) => handleInputChange('turnoverRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daysOfInventory">Dias de Estoque</Label>
                  <Input
                    id="daysOfInventory"
                    type="number"
                    step="0.01"
                    value={formData.daysOfInventory}
                    onChange={(e) => handleInputChange('daysOfInventory', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Fornecedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelfLife">Vida Útil (dias)</Label>
                  <Input
                    id="shelfLife"
                    value={formData.shelfLife}
                    onChange={(e) => handleInputChange('shelfLife', e.target.value)}
                    placeholder="365"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Unidade de Peso</Label>
                  <Select value={formData.weightUnit} onValueChange={(value) => handleInputChange('weightUnit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="G">Grama (G)</SelectItem>
                      <SelectItem value="LB">Libra (LB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensões</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="L x A x C"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageConditions">Condições de Armazenamento</Label>
                  <Select value={formData.storageConditions} onValueChange={(value) => handleInputChange('storageConditions', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione as condições" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEMPERATURE_CONTROLLED">Temperatura Controlada</SelectItem>
                      <SelectItem value="DRY">Seco</SelectItem>
                      <SelectItem value="COOL">Fresco</SelectItem>
                      <SelectItem value="FROZEN">Congelado</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitId">Unidade Organizacional</Label>
                  <Select value={formData.unitId} onValueChange={(value) => handleInputChange('unitId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variações de Produto */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Variações do Produto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="P, M, G, GG, 36, 37, 38, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cinza">Cinza</SelectItem>
                      <SelectItem value="Preto">Preto</SelectItem>
                      <SelectItem value="Branco">Branco</SelectItem>
                      <SelectItem value="Azul">Azul</SelectItem>
                      <SelectItem value="Vermelho">Vermelho</SelectItem>
                      <SelectItem value="Verde">Verde</SelectItem>
                      <SelectItem value="Amarelo">Amarelo</SelectItem>
                      <SelectItem value="Rosa">Rosa</SelectItem>
                      <SelectItem value="Roxo">Roxo</SelectItem>
                      <SelectItem value="Laranja">Laranja</SelectItem>
                      <SelectItem value="Marrom">Marrom</SelectItem>
                      <SelectItem value="Bege">Bege</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">Tipo</Label>
                  <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Padrão">Padrão</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Convencional">Convencional</SelectItem>
                      <SelectItem value="Nilon">Nilon</SelectItem>
                      <SelectItem value="Táticos">Táticos</SelectItem>
                      <SelectItem value="Esportivo">Esportivo</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footwearSize">Numeração (Calçados)</Label>
                  <Select value={formData.footwearSize} onValueChange={(value) => handleInputChange('footwearSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a numeração" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 30).map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clothingSize">Tamanho (Roupas)</Label>
                  <Select value={formData.clothingSize} onValueChange={(value) => handleInputChange('clothingSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PP">PP</SelectItem>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="GG">GG</SelectItem>
                      <SelectItem value="XG">XG</SelectItem>
                      <SelectItem value="XXG">XXG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beltSize">Tamanho (Cintos)</Label>
                  <Select value={formData.beltSize} onValueChange={(value) => handleInputChange('beltSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 80).map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}cm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Algodão">Algodão</SelectItem>
                      <SelectItem value="Poliéster">Poliéster</SelectItem>
                      <SelectItem value="Couro">Couro</SelectItem>
                      <SelectItem value="Sintético">Sintético</SelectItem>
                      <SelectItem value="Lã">Lã</SelectItem>
                      <SelectItem value="Seda">Seda</SelectItem>
                      <SelectItem value="Denim">Denim</SelectItem>
                      <SelectItem value="Nylon">Nylon</SelectItem>
                      <SelectItem value="Borracha">Borracha</SelectItem>
                      <SelectItem value="Plástico">Plástico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Estilo</Label>
                  <Select value={formData.style} onValueChange={(value) => handleInputChange('style', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Esportivo">Esportivo</SelectItem>
                      <SelectItem value="Elegante">Elegante</SelectItem>
                      <SelectItem value="Vintage">Vintage</SelectItem>
                      <SelectItem value="Moderno">Moderno</SelectItem>
                      <SelectItem value="Clássico">Clássico</SelectItem>
                      <SelectItem value="Streetwear">Streetwear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">Estação</Label>
                  <Select value={formData.season} onValueChange={(value) => handleInputChange('season', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a estação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verão">Verão</SelectItem>
                      <SelectItem value="Inverno">Inverno</SelectItem>
                      <SelectItem value="Primavera">Primavera</SelectItem>
                      <SelectItem value="Outono">Outono</SelectItem>
                      <SelectItem value="Todas">Todas as Estações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Produto (se editando) */}
          {product && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Status do Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Label>Status do Estoque:</Label>
                    <Badge className={getStockStatusColor(product.stockStatus)}>
                      {product.stockStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Nível de Estoque:</Label>
                    <Badge variant="outline">
                      {product.stockLevel.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label>Classificação ABC:</Label>
                    <Badge className={getAbcColor(product.abcClassification || 'C')}>
                      {product.abcClassification || 'C'}
                    </Badge>
                  </div>

                  {product.lowStock && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Estoque Baixo</Badge>
                    </div>
                  )}

                  {product.overStock && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Estoque Alto</Badge>
                    </div>
                  )}

                  {product.needsReorder && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Precisa Reposição</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (product ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}