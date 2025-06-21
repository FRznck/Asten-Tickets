/**
 * Petite fonction utilitaire pour forcer le téléchargement d'un fichier.
 * On crée un lien temporaire en mémoire, on simule un clic dessus, puis on le supprime.
 * C'est un trick de navigateur assez classique pour lancer un téléchargement depuis du code JS.
 */
function downloadFile(content, fileName, mimeType) {
    const a = document.createElement('a');
    const blob = new Blob([content], { type: mimeType });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

/**
 * Convertit un tableau d'objets JS en une chaîne de caractères CSV propre.
 * On prend les en-têtes et on mappe chaque objet pour correspondre.
 */
function convertToCSV(data, headers) {
    const headerRow = headers.join(',');
    const rows = data.map(obj => {
        return headers.map(header => {
            // L'astuce ici est de convertir les en-têtes (ex: 'Nom utilisateur')
            // en une clé qui correspond aux propriétés de nos objets (ex: 'nom_utilisateur').
            const key = header.toLowerCase().replace(/ /g, '_');
            return JSON.stringify(obj[key] || '');
        }).join(',');
    });
    return [headerRow, ...rows].join('\n');
}

/**
 * La fonction qui gère l'export de la liste complète des tickets en CSV.
 * Elle prépare les en-têtes et formate les données avant d'appeler notre `downloadFile`.
 */
export function exportTicketsToCSV(tickets) {
    if (!tickets || tickets.length === 0) {
        alert("Aucune donnée de ticket à exporter.");
        return;
    }

    const headers = ['ID', 'Titre', 'Statut', 'Catégorie', 'Date de création', 'Nom utilisateur', 'Email utilisateur', 'Équipe', 'Assigné à'];
    const data = tickets.map(t => ({
        id: t.id,
        titre: t.title,
        statut: t.status,
        catégorie: t.category,
        date_de_création: t.date ? t.date.toLocaleString('fr-FR') : 'N/A',
        nom_utilisateur: t.userName,
        email_utilisateur: t.userEmail,
        équipe: t.equipe || 'Non assignée',
        assigné_à: t.assigne_a || 'Non assigné'
    }));

    const csvContent = convertToCSV(data, headers);
    downloadFile(csvContent, 'export_tickets.csv', 'text/csv;charset=utf-8;');
}

/**
 * Permet d'exporter les données de n'importe quel graphique Chart.js en CSV.
 * C'est pratique pour permettre à l'équipe d'analyser les chiffres bruts dans Excel, par exemple.
 */
export function exportChartDataToCSV(chart, filename) {
    if (!chart) {
        alert("Le graphique n'a pas de données à exporter.");
        return;
    }
    const { labels, datasets } = chart.data;
    let csvContent = `Label,${datasets.map(ds => ds.label).join(',')}\n`;

    labels.forEach((label, index) => {
        const row = [JSON.stringify(label)];
        datasets.forEach(ds => {
            row.push(ds.data[index] || '0');
        });
        csvContent += `${row.join(',')}\n`;
    });

    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * C'est la grosse fonction qui génère le rapport PDF complet.
 * Elle rassemble les stats clés et tous les graphiques, puis les dessine sur le PDF,
 * avec une page par graphique pour que ce soit bien lisible.
 */
export async function exportToPDF(charts, tickets) {
    if (!window.jspdf) {
        alert("La librairie de génération PDF n'est pas chargée.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text("Rapport d'Analyse - Asten Tickets", 20, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Rapport généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

    // D'abord, on ajoute quelques statistiques clés pour donner un aperçu rapide.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text("Statistiques Clés", 20, 45);
    const ticketsOuverts = tickets.filter(t => t.status === 'en-cours' || t.status === 'nouveau').length;
    const ticketsResolus = tickets.filter(t => t.status === 'resolu').length;
    const ticketsFermes = tickets.filter(t => t.status === 'ferme').length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`- Nombre total de tickets: ${tickets.length}`, 22, 55);
    doc.text(`- Tickets ouverts ou en cours: ${ticketsOuverts}`, 22, 62);
    doc.text(`- Tickets résolus: ${ticketsResolus}`, 22, 69);
    doc.text(`- Tickets fermés: ${ticketsFermes}`, 22, 76);

    // Maintenant, on boucle sur chaque graphique pour l'ajouter sur une nouvelle page.
    let chartCount = 0;
    for (const chartName in charts) {
        const chart = charts[chartName];
        if (chart && chart.canvas) {
            try {
                doc.addPage();
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text(chartName, 20, 20);
                
                // Le hack pour les graphiques transparents (comme les donuts) :
                // on les dessine d'abord sur un canvas avec un fond blanc,
                // sinon jsPDF ne sait pas gérer la transparence et plante.
                const newCanvas = document.createElement('canvas');
                newCanvas.width = chart.canvas.width;
                newCanvas.height = chart.canvas.height;
                const newCtx = newCanvas.getContext('2d');
                newCtx.fillStyle = '#FFFFFF';
                newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
                newCtx.drawImage(chart.canvas, 0, 0);
                
                const imgData = newCanvas.toDataURL('image/png', 1.0);
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const chartHeight = (imgProps.height * (pdfWidth - 40)) / imgProps.width;
                
                doc.addImage(imgData, 'PNG', 20, 30, pdfWidth - 40, chartHeight);
                chartCount++;

            } catch (e) {
                console.error(`Impossible d'exporter le graphique "${chartName}":`, e);
         
                // Si un graphique foire, on ne veut pas que tout le PDF plante.
                // On log l'erreur et on ajoute une petite note dans le PDF.
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(255, 0, 0);
                doc.text(`Le graphique "${chartName}" n'a pas pu être généré.`, 20, 30);
                doc.setTextColor(0, 0, 0);
            }
        }
    }
    
    if (chartCount > 0) {
        doc.save("rapport_analyse_asten.pdf");
    } else {
        alert("Aucun graphique disponible pour l'exportation.");
    }
} 