import React, { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { fetchNcmData } from './api/getJSON'; // Importe a função da API

interface NCM {
  Codigo: string;
  Descricao: string;
  Data_Inicio: string;
  Data_Fim: string;
  Tipo_Ato_Ini: string;
  Numero_Ato_Ini: string;
  Ano_Ato_Ini: string;
}

const App: React.FC = () => {
  const [ncmsAtualizados, setNcmsAtualizados] = useState<Set<string>>(new Set());
  const [ncmsSoftware, setNcmsSoftware] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJSONUpdated, setIsJSONUpdated] = useState<boolean>(false);

  // Função para remover pontuações dos códigos NCM
  const normalizeNCM = (codigo: string): string => {
    return codigo.replace(/\./g, '').trim();
  };

  // Função para realizar o GET e processar o JSON da API
  const fetchJSONData = async () => {
    try {
        const jsonData = await fetchNcmData();
        console.log(jsonData);
        if (jsonData && Array.isArray(jsonData.Nomenclaturas)) {
            const ncmSet = new Set<string>();

            jsonData.Nomenclaturas.forEach((ncm: NCM) => {
                const normalizedCode = normalizeNCM(ncm.Codigo);
                ncmSet.add(normalizedCode);
            });

            setNcmsAtualizados(ncmSet);
            setIsJSONUpdated(true);
            setErrorMessage(null);
        } else {
            setErrorMessage('O JSON não contém a chave "Nomenclaturas" ou a estrutura está incorreta.');
        }
    } catch (error) {
        if (error instanceof Error) {
            setErrorMessage('Erro ao processar o arquivo JSON: ' + error.message);
        } else {
            setErrorMessage('Erro ao processar o arquivo JSON: ' + String(error));
        }
    }
};

  // Função para processar o arquivo CSV
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<string[]>(file, {
      complete: (results: ParseResult<string[]>) => {
        const parsedData = new Set(results.data.map(row => normalizeNCM(row[0])));
        setNcmsSoftware(parsedData);
      },
      error: (error) => {
        setErrorMessage('Erro ao processar o arquivo CSV.');
        console.error('Erro ao processar o arquivo CSV:', error);
      }
    });
  };

  // Função para verificar quais NCMs do CSV estão desatualizados
  const verificarNCMs = () => {
    if (ncmsAtualizados.size === 0 || ncmsSoftware.size === 0) {
      setErrorMessage('Certifique-se de que ambos os arquivos (JSON e CSV) foram carregados.');
      return;
    }

    const ncmDesatualizados = Array.from(ncmsSoftware).filter(code => !ncmsAtualizados.has(code));

    if (ncmDesatualizados.length === 0) {
      setErrorMessage('Todos os NCMs estão atualizados.');
    } else {
      setResultado(ncmDesatualizados);
      setErrorMessage(null);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-blue-100 rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold">Verificação de NCMs</h1>

      <button
        onClick={fetchJSONData}
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
      >
        Obter NCMs Atualizados
      </button>

      {isJSONUpdated && (
        <div className="text-green-500 mt-4">Dados JSON atualizados com sucesso!</div>
      )}

      <input
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 hover:file:bg-gray-100"
      />

      <button
        onClick={verificarNCMs}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Verificar NCMs
      </button>

      {errorMessage && (
        <div className="text-red-500 mt-4">{errorMessage}</div>
      )}

      <div>
        {resultado.length === 0 ? (
          !errorMessage && <p className="text-gray-700">Nenhum NCM desatualizado encontrado.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-2">
            <strong>Códigos desatualizados:</strong>
            {resultado.map((ncm, index) => (
              <li key={index} className="text-gray-800">
                {ncm}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
