import re
import os
from fpdf import FPDF
from PIL import Image
import io

CHAT_FILE = r"C:\app_auditorias\uploads\1\Chat de WhatsApp con Cedí Seguridad Operación.txt"
IMAGES_FOLDER = r"C:\app_auditorias\uploads\1"
OUTPUT_FOLDER = r"C:\app_auditorias"
REMITENTES = ["Celta Cedi Nuevo Laika", "CEDI CELTA Corporativo"]
MAX_PDF_SIZE = 80 * 1024 * 1024  # 80 MB

class PDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

def optimize_image(img_path, max_width=500, quality=70):
    img = Image.open(img_path)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    
    if img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)
    return output

def parse_chat():
    with open(CHAT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    messages = []
    current_msg = None
    msg_pattern = re.compile(r'^\[?(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\]?\s*[-–]?\s*(.+?):\s*(.*)$', re.IGNORECASE)
    img_pattern = re.compile(r'(IMG-\d{8}-WA\d{4}\.jpg)', re.IGNORECASE)
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        match = msg_pattern.match(line)
        if match:
            if current_msg and current_msg['images']:
                messages.append(current_msg)
            
            remitente = match.group(3).strip()
            texto = match.group(4).strip()
            
            if remitente in REMITENTES:
                current_msg = {
                    'fecha': match.group(1),
                    'hora': match.group(2),
                    'remitente': remitente,
                    'texto': texto,
                    'images': []
                }
            else:
                current_msg = None
        elif current_msg:
            img_match = img_pattern.search(line)
            if img_match:
                img_name = img_match.group(1)
                img_path = os.path.join(IMAGES_FOLDER, img_name)
                if os.path.exists(img_path):
                    current_msg['images'].append(img_path)
            else:
                current_msg['texto'] += ' ' + line
    
    if current_msg and current_msg['images']:
        messages.append(current_msg)
    
    return messages

def create_pdfs(messages):
    pdf_count = 1
    pdf = PDF()
    pdf.set_auto_page_break(auto=False)
    temp_file = os.path.join(OUTPUT_FOLDER, f'temp_pdf_{pdf_count}.pdf')
    
    for msg in messages:
        pdf.add_page()
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"{msg['remitente']} - {msg['fecha']} {msg['hora']}", 0, 1)
        pdf.ln(2)
        
        pdf.set_font('Arial', '', 10)
        pdf.multi_cell(0, 5, msg['texto'])
        pdf.ln(5)
        
        y_pos = pdf.get_y()
        
        for img_path in msg['images']:
            try:
                img_data = optimize_image(img_path)
                temp_img = os.path.join(OUTPUT_FOLDER, 'temp_img.jpg')
                with open(temp_img, 'wb') as f:
                    f.write(img_data.read())
                
                img = Image.open(temp_img)
                img_width = 180
                img_height = (img.height / img.width) * img_width
                
                if y_pos + img_height > 270:
                    pdf.add_page()
                    y_pos = 20
                
                pdf.image(temp_img, x=15, y=y_pos, w=img_width)
                y_pos += img_height + 5
                pdf.set_y(y_pos)
                
                os.remove(temp_img)
            except Exception as e:
                print(f"Error procesando imagen {img_path}: {e}")
        
        pdf.output(temp_file)
        
        if os.path.getsize(temp_file) > MAX_PDF_SIZE:
            pdf_count += 1
            final_file = os.path.join(OUTPUT_FOLDER, f'whatsapp_messages_{pdf_count-1}.pdf')
            os.rename(temp_file, final_file)
            print(f"PDF creado: {final_file}")
            
            pdf = PDF()
            pdf.set_auto_page_break(auto=False)
            temp_file = os.path.join(OUTPUT_FOLDER, f'temp_pdf_{pdf_count}.pdf')
    
    final_file = os.path.join(OUTPUT_FOLDER, f'whatsapp_messages_{pdf_count}.pdf')
    if os.path.exists(temp_file):
        os.rename(temp_file, final_file)
        print(f"PDF creado: {final_file}")

if __name__ == '__main__':
    print("Procesando chat de WhatsApp...")
    messages = parse_chat()
    print(f"Mensajes encontrados con imágenes: {len(messages)}")
    
    if messages:
        create_pdfs(messages)
        print("Proceso completado.")
    else:
        print("No se encontraron mensajes con imágenes de los remitentes especificados.")
