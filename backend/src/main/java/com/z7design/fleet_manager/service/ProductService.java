package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ProductDTO;
import com.z7design.fleet_manager.model.Product;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.repository.ProductRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final PurchaseRequestService purchaseRequestService;

    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ProductDTO> getProductById(UUID id) {
        return productRepository.findById(id)
                .map(this::convertToDTO);
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = convertToEntity(productDTO);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        // LÃ³gica inteligente para calcular estoque mÃ­nimo/mÃ¡ximo
        calculateIntelligentStockLevels(product);

        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    @Transactional
    public ProductDTO updateProduct(UUID id, ProductDTO productDTO) {
        Optional<Product> existingProduct = productRepository.findById(id);
        if (existingProduct.isPresent()) {
            Product product = existingProduct.get();
            updateProductFromDTO(product, productDTO);
            product.setUpdatedAt(LocalDateTime.now());

            // Recalcular nÃ­veis de estoque se necessÃ¡rio
            calculateIntelligentStockLevels(product);

            Product savedProduct = productRepository.save(product);
            return convertToDTO(savedProduct);
        }
        throw new RuntimeException("Produto nÃ£o encontrado");
    }

    @Transactional
    public void deleteProduct(UUID id) {
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getOverStockProducts() {
        return productRepository.findOverStockProducts().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsNeedingReorder() {
        return productRepository.findProductsNeedingReorder().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String searchTerm) {
        return productRepository.searchProducts(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByUnit(UUID unitId) {
        return productRepository.findByUnitEntityId(unitId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsBySupplier(String supplier) {
        return productRepository.findBySupplier(supplier).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByAbcClassification(String classification) {
        return productRepository.findByAbcClassification(classification).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getActiveProductsCount() {
        return productRepository.countActiveProducts();
    }

    @Transactional(readOnly = true)
    public long getLowStockProductsCount() {
        return productRepository.countLowStockProducts();
    }

    @Transactional(readOnly = true)
    public long getOutOfStockProductsCount() {
        return productRepository.countOutOfStockProducts();
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalInventoryValue() {
        return productRepository.getTotalInventoryValue();
    }

    // LÃ³gica inteligente para calcular nÃ­veis de estoque
    private void calculateIntelligentStockLevels(Product product) {
        if (product.getCurrentStock() == null) {
            product.setCurrentStock(BigDecimal.ZERO);
        }

        if (product.getMinimumStock() == null || product.getMinimumStock().compareTo(BigDecimal.ZERO) == 0) {
            // Calcular estoque mÃ­nimo baseado no consumo mÃ©dio e tempo de reposiÃ§Ã£o
            BigDecimal safetyStock = calculateSafetyStock(product);
            product.setMinimumStock(safetyStock);
        }

        if (product.getMaximumStock() == null || product.getMaximumStock().compareTo(BigDecimal.ZERO) == 0) {
            // Calcular estoque mÃ¡ximo baseado no consumo mÃ©dio e frequÃªncia de
            // reposiÃ§Ã£o
            BigDecimal maxStock = calculateMaximumStock(product);
            product.setMaximumStock(maxStock);
        }

        if (product.getReorderPoint() == null || product.getReorderPoint().compareTo(BigDecimal.ZERO) == 0) {
            // Calcular ponto de reposiÃ§Ã£o
            BigDecimal reorderPoint = calculateReorderPoint(product);
            product.setReorderPoint(reorderPoint);
        }

        // Calcular estoque de seguranÃ§a
        if (product.getSafetyStock() == null) {
            BigDecimal safetyStock = calculateSafetyStock(product);
            product.setSafetyStock(safetyStock);
        }

        // Calcular classificaÃ§Ã£o ABC
        if (product.getAbcClassification() == null) {
            String abcClassification = calculateAbcClassification(product);
            product.setAbcClassification(abcClassification);
        }
    }

    private BigDecimal calculateSafetyStock(Product product) {
        // Estoque de seguranÃ§a = (Consumo mÃ©dio diÃ¡rio Ã— Tempo de reposiÃ§Ã£o) Ã—
        // Fator de seguranÃ§a
        BigDecimal dailyConsumption = product.getAverageConsumption() != null ? product.getAverageConsumption()
                : BigDecimal.valueOf(10);
        BigDecimal leadTime = product.getLeadTime() != null ? product.getLeadTime() : BigDecimal.valueOf(7);
        BigDecimal safetyFactor = BigDecimal.valueOf(1.5); // 50% de seguranÃ§a

        return dailyConsumption.multiply(leadTime).multiply(safetyFactor);
    }

    private BigDecimal calculateMaximumStock(Product product) {
        // Estoque mÃ¡ximo = (Consumo mÃ©dio diÃ¡rio Ã— FrequÃªncia de reposiÃ§Ã£o) +
        // Estoque de seguranÃ§a
        BigDecimal dailyConsumption = product.getAverageConsumption() != null ? product.getAverageConsumption()
                : BigDecimal.valueOf(10);
        BigDecimal reorderFrequency = BigDecimal.valueOf(30); // 30 dias
        BigDecimal safetyStock = calculateSafetyStock(product);

        return dailyConsumption.multiply(reorderFrequency).add(safetyStock);
    }

    private BigDecimal calculateReorderPoint(Product product) {
        // Ponto de reposiÃ§Ã£o = (Consumo mÃ©dio diÃ¡rio Ã— Tempo de reposiÃ§Ã£o) +
        // Estoque de seguranÃ§a
        BigDecimal dailyConsumption = product.getAverageConsumption() != null ? product.getAverageConsumption()
                : BigDecimal.valueOf(10);
        BigDecimal leadTime = product.getLeadTime() != null ? product.getLeadTime() : BigDecimal.valueOf(7);
        BigDecimal safetyStock = calculateSafetyStock(product);

        return dailyConsumption.multiply(leadTime).add(safetyStock);
    }

    private String calculateAbcClassification(Product product) {
        // ClassificaÃ§Ã£o ABC baseada no valor do estoque
        BigDecimal inventoryValue = product.getCurrentStock().multiply(product.getCostPrice());

        // Valores de referÃªncia (podem ser ajustados)
        BigDecimal aThreshold = BigDecimal.valueOf(10000); // Produtos de alto valor
        BigDecimal bThreshold = BigDecimal.valueOf(1000); // Produtos de mÃ©dio valor

        if (inventoryValue.compareTo(aThreshold) >= 0) {
            return "A";
        } else if (inventoryValue.compareTo(bThreshold) >= 0) {
            return "B";
        } else {
            return "C";
        }
    }

    // MÃ©todos de conversÃ£o
    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .code(product.getCode())
                .barcode(product.getBarcode())
                .category(product.getCategory())
                .brand(product.getBrand())
                .model(product.getModel())
                .unit(product.getUnit())
                .costPrice(product.getCostPrice())
                .salePrice(product.getSalePrice())
                .currentStock(product.getCurrentStock())
                .minimumStock(product.getMinimumStock())
                .maximumStock(product.getMaximumStock())
                .reorderPoint(product.getReorderPoint())
                .status(product.getStatus())
                .location(product.getLocation())
                .supplier(product.getSupplier())
                .shelfLife(product.getShelfLife())
                .weight(product.getWeight())
                .weightUnit(product.getWeightUnit())
                .dimensions(product.getDimensions())
                .storageConditions(product.getStorageConditions())
                .notes(product.getNotes())
                // Campos para variaÃ§Ãµes de produtos
                .size(product.getSize())
                .color(product.getColor())
                .productType(product.getProductType())
                .footwearSize(product.getFootwearSize())
                .clothingSize(product.getClothingSize())
                .beltSize(product.getBeltSize())
                .material(product.getMaterial())
                .style(product.getStyle())
                .gender(product.getGender())
                .season(product.getSeason())
                .unitId(product.getUnitEntity() != null ? product.getUnitEntity().getId() : null)
                .unitName(product.getUnitEntity() != null ? product.getUnitEntity().getName() : null)
                .lastInventoryDate(product.getLastInventoryDate())
                .nextInventoryDate(product.getNextInventoryDate())
                .lastPurchaseDate(product.getLastPurchaseDate())
                .lastSaleDate(product.getLastSaleDate())
                .averageConsumption(product.getAverageConsumption())
                .consumptionPeriod(product.getConsumptionPeriod())
                .safetyStock(product.getSafetyStock())
                .leadTime(product.getLeadTime())
                .abcClassification(product.getAbcClassification())
                .turnoverRate(product.getTurnoverRate())
                .daysOfInventory(product.getDaysOfInventory())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();

        // Campos calculados
        dto.setStockStatus(product.getStockStatus());
        dto.setStockLevel(product.getStockLevel());
        dto.setLowStock(product.isLowStock());
        dto.setOverStock(product.isOverStock());
        dto.setNeedsReorder(product.needsReorder());
        dto.setReorderQuantity(product.calculateReorderQuantity());

        return dto;
    }

    private Product convertToEntity(ProductDTO dto) {
        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .code(dto.getCode())
                .barcode(dto.getBarcode())
                .category(dto.getCategory())
                .brand(dto.getBrand())
                .model(dto.getModel())
                .unit(dto.getUnit())
                .costPrice(dto.getCostPrice())
                .salePrice(dto.getSalePrice())
                .currentStock(dto.getCurrentStock())
                .minimumStock(dto.getMinimumStock())
                .maximumStock(dto.getMaximumStock())
                .reorderPoint(dto.getReorderPoint())
                .status(dto.getStatus())
                .location(dto.getLocation())
                .supplier(dto.getSupplier())
                .shelfLife(dto.getShelfLife())
                .weight(dto.getWeight())
                .weightUnit(dto.getWeightUnit())
                .dimensions(dto.getDimensions())
                .storageConditions(dto.getStorageConditions())
                .notes(dto.getNotes())
                // Campos para variaÃ§Ãµes de produtos
                .size(dto.getSize())
                .color(dto.getColor())
                .productType(dto.getProductType())
                .footwearSize(dto.getFootwearSize())
                .clothingSize(dto.getClothingSize())
                .beltSize(dto.getBeltSize())
                .material(dto.getMaterial())
                .style(dto.getStyle())
                .gender(dto.getGender())
                .season(dto.getSeason())
                .averageConsumption(dto.getAverageConsumption())
                .consumptionPeriod(dto.getConsumptionPeriod())
                .safetyStock(dto.getSafetyStock())
                .leadTime(dto.getLeadTime())
                .abcClassification(dto.getAbcClassification())
                .turnoverRate(dto.getTurnoverRate())
                .daysOfInventory(dto.getDaysOfInventory())
                .build();

        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(product::setUnitEntity);
        }

        return product;
    }

    @Transactional
    public boolean consumeStock(UUID productId, BigDecimal quantity) {
        log.info("Consumindo estoque do produto {}: {}", productId, quantity);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + productId));

        if (product.getCurrentStock() == null) {
            product.setCurrentStock(BigDecimal.ZERO);
        }

        // Deduzir quantidade (permite negativo conforme solicitado)
        product.setCurrentStock(product.getCurrentStock().subtract(quantity));
        product.setUpdatedAt(LocalDateTime.now());

        // Verificar ponto de reposição
        boolean isLowStock = false;
        if (product.needsReorder()) {
            log.warn("Estoque baixo detectado para produto: {}. Iniciando reabastecimento automático.",
                    product.getName());
            purchaseRequestService.createAutomaticRestockRequest(product);
            isLowStock = true;
        }

        productRepository.save(product);
        return isLowStock; // Retorna true se ficou com estoque baixo/crítico (para aviso no frontend)
    }

    private void updateProductFromDTO(Product product, ProductDTO dto) {
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCode(dto.getCode());
        product.setBarcode(dto.getBarcode());
        product.setCategory(dto.getCategory());
        product.setBrand(dto.getBrand());
        product.setModel(dto.getModel());
        product.setUnit(dto.getUnit());
        product.setCostPrice(dto.getCostPrice());
        product.setSalePrice(dto.getSalePrice());
        product.setCurrentStock(dto.getCurrentStock());
        product.setMinimumStock(dto.getMinimumStock());
        product.setMaximumStock(dto.getMaximumStock());
        product.setReorderPoint(dto.getReorderPoint());
        product.setStatus(dto.getStatus());
        product.setLocation(dto.getLocation());
        product.setSupplier(dto.getSupplier());
        product.setShelfLife(dto.getShelfLife());
        product.setWeight(dto.getWeight());
        product.setWeightUnit(dto.getWeightUnit());
        product.setDimensions(dto.getDimensions());
        product.setStorageConditions(dto.getStorageConditions());
        product.setNotes(dto.getNotes());
        // Campos para variaÃ§Ãµes de produtos
        product.setSize(dto.getSize());
        product.setColor(dto.getColor());
        product.setProductType(dto.getProductType());
        product.setFootwearSize(dto.getFootwearSize());
        product.setClothingSize(dto.getClothingSize());
        product.setBeltSize(dto.getBeltSize());
        product.setMaterial(dto.getMaterial());
        product.setStyle(dto.getStyle());
        product.setGender(dto.getGender());
        product.setSeason(dto.getSeason());
        product.setAverageConsumption(dto.getAverageConsumption());
        product.setConsumptionPeriod(dto.getConsumptionPeriod());
        product.setSafetyStock(dto.getSafetyStock());
        product.setLeadTime(dto.getLeadTime());
        product.setAbcClassification(dto.getAbcClassification());
        product.setTurnoverRate(dto.getTurnoverRate());
        product.setDaysOfInventory(dto.getDaysOfInventory());

        if (dto.getUnitId() != null) {
            Optional<Unit> unit = unitRepository.findById(dto.getUnitId());
            unit.ifPresent(product::setUnitEntity);
        }
    }
}
