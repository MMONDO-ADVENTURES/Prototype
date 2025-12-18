#!/usr/bin/env python3
import sqlite3

def fix_country_images():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    print("Checking country_images table...")
    
    # Get current columns
    cursor.execute("PRAGMA table_info(country_images)")
    current_columns = [col[1] for col in cursor.fetchall()]
    
    columns_to_add = [
        ('filename', 'VARCHAR(200)'),
        ('filepath', 'VARCHAR(500)')
    ]
    
    for col_name, col_type in columns_to_add:
        if col_name not in current_columns:
            try:
                cursor.execute(f'ALTER TABLE country_images ADD COLUMN {col_name} {col_type}')
                print(f'✓ Added {col_name} column')
            except Exception as e:
                print(f'✗ Error adding {col_name}: {e}')
        else:
            print(f'✓ {col_name} column already exists')
    
    conn.commit()
    
    # Also check if countries table has description
    print("\nChecking countries table...")
    cursor.execute("PRAGMA table_info(countries)")
    country_columns = [col[1] for col in cursor.fetchall()]
    
    if 'description' not in country_columns:
        try:
            cursor.execute('ALTER TABLE countries ADD COLUMN description TEXT')
            print('✓ Added description column to countries')
        except Exception as e:
            print(f'✗ Error adding description: {e}')
    else:
        print('✓ description column already exists in countries')
    
    conn.commit()
    
    # Show final structure
    print("\n=== Final Table Structures ===")
    
    print("\ncountries:")
    cursor.execute("PRAGMA table_info(countries)")
    for col in cursor.fetchall():
        print(f"  {col[1]:20} {col[2]:15} {'PRIMARY' if col[5] else ''}")
    
    print("\ncountry_images:")
    cursor.execute("PRAGMA table_info(country_images)")
    for col in cursor.fetchall():
        print(f"  {col[1]:20} {col[2]:15} {'PRIMARY' if col[5] else ''}")
    
    conn.close()
    print("\n✅ All tables verified and fixed!")

if __name__ == "__main__":
    fix_country_images()
