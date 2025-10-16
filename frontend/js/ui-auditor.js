async function handleSkuScan(scannedSku) {
    const scanInput = document.getElementById('scan-input');
    if (!scannedSku) return;

    scannedSku = scannedSku.trim().toUpperCase().replace(/^0+/, '');
    if (scanInput) scanInput.value = '';

    const isCollaborative = state.currentAudit && state.currentAudit.colaboradores && state.currentAudit.colaboradores.length > 0;

    if (isCollaborative) {
        const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);
        if (!productRow) {
            speak("Producto no encontrado en la lista.");
            handleCollaborativeScanNotFound(scannedSku);
        } else {
            // Si la fila estaba oculta, la mostramos de nuevo.
            if (productRow.style.display === 'none') {
                productRow.style.display = '';
                speak('Producto re-escaneado, registrando novedad.');
            } else {
                // Si ya era visible, damos feedback de voz sobre su estado actual.
                const novelty = productRow.querySelector('.novelty-select').value;
                const docQuantity = parseInt(productRow.querySelector('.doc-quantity').textContent, 10);
                const physicalCount = parseInt(productRow.querySelector('.physical-count').value, 10) || 0;
                const productName = productRow.cells[2].textContent;

                switch (novelty) {
                    case 'faltante':
                        speak(`Faltaban ${docQuantity - physicalCount}`);
                        break;
                    case 'sobrante':
                        speak(`Sobraban ${physicalCount - docQuantity}`);
                        break;
                    case 'averia':
                        speak(`Producto registrado con avería`);
                        break;
                    default:
                        speak("");
                        break;
                }
            }
            // En cualquier caso (re-escaneo o primer escaneo), abrimos el modal para resolver.
            handleCollaborativeScanFound(productRow);
        }
    } else {
        // Non-collaborative flow
        const productRow = document.querySelector(`tr[data-sku="${scannedSku}"]`);
        if (!productRow) {
            speak(`Producto no encontrado.`);
            setLastScanned(null);
            return;
        }

        const lastScanned = state.lastScanned;
        const productId = productRow.getAttribute('data-product-id');

        if (lastScanned && lastScanned.sku === scannedSku) {
            const physicalCountInput = productRow.querySelector('.physical-count');
            productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productRow.classList.add('highlight-manual');
            physicalCountInput.focus();
            physicalCountInput.select();
            setLastScanned(null);
            return;
        }

        if (lastScanned && lastScanned.sku !== scannedSku) {
            const lastProductRow = document.querySelector(`tr[data-sku="${lastScanned.sku}"]`);
            if (lastProductRow) {
                const lastProductId = lastProductRow.getAttribute('data-product-id');
                const docQuantity = parseInt(lastProductRow.querySelector('.doc-quantity').textContent, 10) || 0;
                try {
                    await api.updateProduct(state.currentAudit.id, lastProductId, {
                        cantidad_fisica: docQuantity,
                        novedad: 'sin_novedad',
                        observaciones: ''
                    });
                    lastProductRow.classList.add('is-saved');
                    lastProductRow.querySelector('.physical-count').value = docQuantity;
                    lastProductRow.querySelector('.novelty-select').value = 'sin_novedad';
                    setTimeout(() => lastProductRow.classList.remove('is-saved'), 1200);
                    updateCompliancePercentage(state.currentAudit.id);
                } catch (error) {
                    console.error(`Error al autoguardar producto ${lastScanned.sku}: ${error.message}`);
                    speak(`Error al guardar ${lastScanned.sku}`);
                }
            }
        }

        const currentDocQuantity = productRow.querySelector('.doc-quantity').textContent;
        speak(`Cantidad: ${currentDocQuantity}`);
        setLastScanned({ sku: scannedSku, productId: productId });
        if (scanInput) scanInput.focus();
    }
}
