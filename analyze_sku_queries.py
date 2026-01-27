import os
import re
from pathlib import Path

def analyze_sql_queries():
    """Analiza todas las consultas SQL que involucran SKUs en el proyecto"""
    
    project_root = Path("c:/app_auditorias")
    
    # Patrones para buscar consultas SQL
    sql_patterns = [
        r'SELECT.*sku.*FROM',
        r'WHERE.*sku.*=',
        r'JOIN.*ON.*sku',
        r'INSERT.*sku',
        r'UPDATE.*sku',
        r'DELETE.*sku',
        r'\.query\([^)]*sku',
        r'filter\([^)]*sku',
        r'db\.query\([^)]*Product',
        r'models\.Product',
        r'Product\.',
        r'productos_auditados',
        r'skuIndex',
        r'normalizedSku',
        r'scannedSku'
    ]
    
    # Archivos a analizar
    file_patterns = [
        "**/*.py",
        "**/*.js",
        "**/*.jsx",
        "**/*.sql"
    ]
    
    print("="*80)
    print("ANALISIS DE CONSULTAS SQL Y USO DE SKUs")
    print("="*80)
    
    sku_usage = {}
    
    for pattern in file_patterns:
        for file_path in project_root.glob(pattern):
            if any(exclude in str(file_path) for exclude in ['node_modules', '.git', '__pycache__', 'venv']):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Buscar patrones SQL
                    for sql_pattern in sql_patterns:
                        matches = re.finditer(sql_pattern, content, re.IGNORECASE | re.MULTILINE)
                        for match in matches:
                            # Obtener contexto (línea completa)
                            lines = content[:match.start()].count('\n')
                            line_start = content.rfind('\n', 0, match.start()) + 1
                            line_end = content.find('\n', match.end())
                            if line_end == -1:
                                line_end = len(content)
                            
                            line_content = content[line_start:line_end].strip()
                            
                            if file_path.name not in sku_usage:
                                sku_usage[file_path.name] = []
                            
                            sku_usage[file_path.name].append({
                                'line': lines + 1,
                                'pattern': sql_pattern,
                                'content': line_content[:200] + ('...' if len(line_content) > 200 else ''),
                                'file_path': str(file_path.relative_to(project_root))
                            })
                            
            except Exception as e:
                continue
    
    # Mostrar resultados organizados
    for file_name, usages in sorted(sku_usage.items()):
        print(f"\n{'='*60}")
        print(f"ARCHIVO: {file_name}")
        print(f"{'='*60}")
        
        # Agrupar por tipo de operación
        operations = {
            'CONSULTAS SELECT': [],
            'FILTROS WHERE': [],
            'ACTUALIZACIONES': [],
            'INDICES/BUSQUEDAS': [],
            'OTROS': []
        }
        
        for usage in usages:
            content = usage['content']
            if any(word in content.upper() for word in ['SELECT', 'QUERY', 'GET']):
                operations['CONSULTAS SELECT'].append(usage)
            elif any(word in content.upper() for word in ['WHERE', 'FILTER']):
                operations['FILTROS WHERE'].append(usage)
            elif any(word in content.upper() for word in ['UPDATE', 'SET', 'SAVE']):
                operations['ACTUALIZACIONES'].append(usage)
            elif any(word in content.upper() for word in ['INDEX', 'FIND', 'SEARCH']):
                operations['INDICES/BUSQUEDAS'].append(usage)
            else:
                operations['OTROS'].append(usage)
        
        for op_type, op_usages in operations.items():
            if op_usages:
                print(f"\n  {op_type}:")
                for usage in op_usages[:5]:  # Limitar a 5 por categoría
                    print(f"    Línea {usage['line']:3d}: {usage['content']}")
                if len(op_usages) > 5:
                    print(f"    ... y {len(op_usages) - 5} más")
    
    print(f"\n{'='*80}")
    print("RESUMEN DE PATRONES DE USO DE SKU")
    print(f"{'='*80}")
    
    # Contar tipos de uso
    total_usages = sum(len(usages) for usages in sku_usage.values())
    print(f"Total de referencias a SKU encontradas: {total_usages}")
    print(f"Archivos que usan SKU: {len(sku_usage)}")
    
    # Archivos más importantes
    print(f"\nArchivos con más referencias a SKU:")
    sorted_files = sorted(sku_usage.items(), key=lambda x: len(x[1]), reverse=True)
    for file_name, usages in sorted_files[:10]:
        print(f"  {file_name:<30} {len(usages):3d} referencias")
    
    return sku_usage

if __name__ == "__main__":
    analyze_sql_queries()