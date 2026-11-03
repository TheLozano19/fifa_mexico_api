const BASE_URL = 'https://api.fifa.com/api/v3';

document.addEventListener("DOMContentLoaded", () => {
    obtenerPartidosMexico();
});

async function obtenerPartidosMexico() {
    const container = document.getElementById("matches-container");

    try {
        // Petición al calendario del Grupo A
        const url = `${BASE_URL}/calendar/matches?idCompetition=17&idSeason=285023&idGroup=289275&language=es`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrar estricto para obtener únicamente los partidos de México
        const partidosMexico = data.Results.filter(
            match => match.Home?.IdCountry === 'MEX' || match.Away?.IdCountry === 'MEX'
        );

        if (!partidosMexico || partidosMexico.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #555;">No se encontraron partidos para la Selección Mexicana.</p>`;
            return;
        }

        // Limpiar contenedor de carga
        container.innerHTML = "";

        // Iterar cada partido para consultar su timeline y estadísticas
        for (const match of partidosMexico) {
            const homeName = match.Home?.TeamName?.[0]?.Description || match.Home?.Name?.[0]?.Description || "Local";
            const awayName = match.Away?.TeamName?.[0]?.Description || match.Away?.Name?.[0]?.Description || "Visitante";
            
            const matchDate = new Date(match.Date).toLocaleString();
            const stadiumName = match.Stadium?.Name?.[0]?.Description || "Por definir";
            
            const scoreHome = match.Home?.Score ?? 0;
            const scoreAway = match.Away?.Score ?? 0;

            let golesDetalle = "Sin goles registrados";
            let totalAmarillas = 0;
            let totalRojas = 0;

            try {
                const statsRes = await fetch(`${BASE_URL}/timelines/${match.IdMatch}?language=es`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    const events = statsData.Event || [];

                    const goles = events.filter(e => e.Type === 0);
                    const amarillas = events.filter(e => e.Type === 2);
                    const rojas = events.filter(e => e.Type === 3);

                    totalAmarillas = amarillas.length;
                    totalRojas = rojas.length;

                    if (goles.length > 0) {
                        golesDetalle = goles.map(g => `Minuto ${g.MatchMinute}': ${g.Description?.[0]?.Description || 'Gol'}`).join('<br>');
                    }
                }
            } catch (timelineErr) {
                console.warn("No se pudo obtener el timeline:", timelineErr);
            }

            // Renderizado en el DOM con HTML semántico
            const card = document.createElement("article");
            card.style.cssText = "background: #fff; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid #00c853;";
            
            card.innerHTML = `
                <h3 style="color: #0d47a1; margin-top: 0;">${homeName} vs ${awayName}</h3>
                <p><strong>Fecha y Hora:</strong> ${matchDate}</p>
                <p><strong>Estadio:</strong> ${stadiumName}</p>
                <p><strong>Marcador:</strong> <span style="color: #d81b60; font-weight: bold;">${scoreHome} - ${scoreAway}</span></p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p><strong> Goles:</strong><br>${golesDetalle}</p>
                <p><strong> Tarjetas Amarillas:</strong> ${totalAmarillas} | <strong> Tarjetas Rojas:</strong> ${totalRojas}</p>
            `;

            container.appendChild(card);
        }

    } catch (error) {
        console.error('Error al consultar la API de FIFA:', error);
        container.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 6px; text-align: center;">
                <h3>Error de Conexión o CORS</h3>
                <p>Asegúrate de ejecutar tu código usando un servidor local (Live Server en VS Code).</p>
                <p><small>${error.message}</small></p>
            </div>
        `;
    }
}