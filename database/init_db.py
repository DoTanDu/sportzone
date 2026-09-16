import sqlite3
import os
import sys

# Đảm bảo in tiếng Việt UTF-8 chuẩn trên Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(__file__), 'sports_store.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), 'schema.sql')
SEED_PATH = os.path.join(os.path.dirname(__file__), 'seed.sql')

def init_database():
    print("🚀 Bắt đầu khởi tạo cơ sở dữ liệu SQLite...")
    
    # Xóa file db cũ nếu có
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print(f"  - Đã làm mới tệp database cũ: {DB_PATH}")
        except Exception as e:
            print(f"  - Không thể xóa db cũ: {e}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Đọc và thực thi schema.sql
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    cursor.executescript(schema_sql)
    print("✅ Đã tạo thành công cấu trúc bảng (schema.sql)")

    # Đọc và thực thi seed.sql
    with open(SEED_PATH, 'r', encoding='utf-8') as f:
        seed_sql = f.read()

    cursor.executescript(seed_sql)
    conn.commit()
    print("✅ Đã nạp dữ liệu mẫu khởi tạo thành công (seed.sql)")

    # Kiểm tra số lượng bản ghi trong từng bảng
    tables = [
        'users', 'addresses', 'categories', 'brands', 'products',
        'product_images', 'product_variants', 'coupons', 'orders',
        'order_items', 'order_timeline', 'carts', 'cart_items', 'reviews'
    ]
    print("\n📊 THỐNG KÊ DỮ LIỆU ĐÃ KHỞI TẠO:")
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"  • Bảng '{t}': {count} bản ghi")

    # Truy vấn thử nghiệm mẫu: Lấy sản phẩm kèm thương hiệu, danh mục và số biến thể
    print("\n🔍 TRUY VẤN THỬ NGHIỆM: Danh sách sản phẩm nổi bật")
    query = """
    SELECT 
        p.id, p.name, b.name as brand_name, c.name as category_name,
        p.base_price, COUNT(v.id) as variant_count, SUM(v.stock_quantity) as total_stock
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants v ON p.id = v.product_id
    GROUP BY p.id
    ORDER BY p.id ASC;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    for row in rows:
        price_vnd = f"{int(row[4]):,} VNĐ".replace(",", ".")
        print(f"  [{row[0]}] {row[1]} | Hãng: {row[2]} | Danh mục: {row[3]} | Giá: {price_vnd} | {row[5]} biến thể (Tồn: {row[6]})")

    # Truy vấn thử nghiệm đơn hàng
    print("\n📦 TRUY VẤN THỬ NGHIỆM: Chi tiết đơn hàng mẫu")
    cursor.execute("""
    SELECT o.order_code, o.receiver_name, o.total_amount, o.order_status, o.payment_status
    FROM orders o WHERE o.id = 1
    """)
    order = cursor.fetchone()
    total_vnd = f"{int(order[2]):,} VNĐ".replace(",", ".")
    print(f"  Mã đơn: {order[0]} | Người nhận: {order[1]} | Tổng tiền: {total_vnd} | Trạng thái: {order[3]} | Thanh toán: {order[4]}")
    
    cursor.execute("""
    SELECT product_name, variant_label, quantity, unit_price, total_price
    FROM order_items WHERE order_id = 1
    """)
    items = cursor.fetchall()
    for it in items:
        unit_vnd = f"{int(it[3]):,} VNĐ".replace(",", ".")
        total_item_vnd = f"{int(it[4]):,} VNĐ".replace(",", ".")
        print(f"    + {it[0]} ({it[1]}) x{it[2]} = {total_item_vnd}")

    conn.close()
    print("\n🎉 Khởi tạo hoàn tất! Tệp CSDL sẵn sàng sử dụng tại: sports_store.db\n")

if __name__ == '__main__':
    init_database()
