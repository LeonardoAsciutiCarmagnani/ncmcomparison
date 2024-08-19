export const fetchNcmData = async () => {
    try {
        const response = await fetch('/api/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO');
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.status);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error("Erro ao realizar requisição JSON: ", error.message);
        } else {
            console.error("Erro ao realizar requisição JSON: ", String(error));
        }
        return null;
    }
}
