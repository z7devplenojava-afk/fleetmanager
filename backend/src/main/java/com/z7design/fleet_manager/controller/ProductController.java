package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ProductDTO;
import com.z7design.fleet_manager.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        log.info("Buscando todos os produtos");
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable("id") UUID id) {
        log.info("Buscando produto com ID: {}", id);
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO productDTO) {
        log.info("Criando novo produto: {}", productDTO.getName());
        ProductDTO createdProduct = productService.createProduct(productDTO);
        return ResponseEntity.ok(createdProduct);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable("id") UUID id, @RequestBody ProductDTO productDTO) {
        log.info("Atualizando produto com ID: {}", id);
        try {
            ProductDTO updatedProduct = productService.updateProduct(id, productDTO);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") UUID id) {
        log.info("Deletando produto com ID: {}", id);
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductDTO>> getLowStockProducts() {
        log.info("Buscando produtos com estoque baixo");
        List<ProductDTO> products = productService.getLowStockProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/over-stock")
    public ResponseEntity<List<ProductDTO>> getOverStockProducts() {
        log.info("Buscando produtos com estoque alto");
        List<ProductDTO> products = productService.getOverStockProducts();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/needing-reorder")
    public ResponseEntity<List<ProductDTO>> getProductsNeedingReorder() {
        log.info("Buscando produtos que precisam de reposiÃ§Ã£o");
        List<ProductDTO> products = productService.getProductsNeedingReorder();
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam(value = "searchTerm") String searchTerm) {
        log.info("Buscando produtos com termo: {}", searchTerm);
        List<ProductDTO> products = productService.searchProducts(searchTerm);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductDTO>> getProductsByCategory(@PathVariable("category") String category) {
        log.info("Buscando produtos da categoria: {}", category);
        List<ProductDTO> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<ProductDTO>> getProductsByUnit(@PathVariable("unitId") UUID unitId) {
        log.info("Buscando produtos da unidade: {}", unitId);
        List<ProductDTO> products = productService.getProductsByUnit(unitId);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/supplier/{supplier}")
    public ResponseEntity<List<ProductDTO>> getProductsBySupplier(@PathVariable("supplier") String supplier) {
        log.info("Buscando produtos do fornecedor: {}", supplier);
        List<ProductDTO> products = productService.getProductsBySupplier(supplier);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/abc-classification/{classification}")
    public ResponseEntity<List<ProductDTO>> getProductsByAbcClassification(@PathVariable("classification") String classification) {
        log.info("Buscando produtos da classificaÃ§Ã£o ABC: {}", classification);
        List<ProductDTO> products = productService.getProductsByAbcClassification(classification);
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/stats/active-count")
    public ResponseEntity<Long> getActiveProductsCount() {
        log.info("Buscando contagem de produtos ativos");
        Long count = productService.getActiveProductsCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/low-stock-count")
    public ResponseEntity<Long> getLowStockProductsCount() {
        log.info("Buscando contagem de produtos com estoque baixo");
        Long count = productService.getLowStockProductsCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/out-of-stock-count")
    public ResponseEntity<Long> getOutOfStockProductsCount() {
        log.info("Buscando contagem de produtos sem estoque");
        Long count = productService.getOutOfStockProductsCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/total-inventory-value")
    public ResponseEntity<BigDecimal> getTotalInventoryValue() {
        log.info("Buscando valor total do inventÃ¡rio");
        BigDecimal value = productService.getTotalInventoryValue();
        return ResponseEntity.ok(value);
    }
}
