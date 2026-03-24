-- Adição de fotos às ordens de serviço de frota
CREATE TABLE fleet_work_order_photos (
    work_order_id UUID NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_work_order_photos FOREIGN KEY (work_order_id) REFERENCES fleet_work_orders(id)
);
