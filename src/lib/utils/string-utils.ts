/**
 * Formata um nome para o padrão Title Case clínico.
 * Exemplo: "JOAO DA SILVA" -> "Joao da Silva"
 * Mantém preposições em minúsculo.
 */
export function formatarNomeClinico(nome: string): string {
  if (!nome) return ""

  const preposicoes = ["da", "de", "do", "dos", "das", "e"]
  
  // Divide preservando espaços para não "comer" a tecla space do usuário
  const partes = nome.split(/(\s+)/)
  let wordIndex = 0

  return partes
    .map((parte) => {
      // Se for espaço vindo do split, mantém exatamente como está
      if (parte.trim() === "") return parte

      const palavra = parte.toLowerCase()
      let formatada = palavra

      // Capitaliza se for a primeira palavra ou se não for uma preposição
      if (wordIndex === 0 || !preposicoes.includes(palavra)) {
        formatada = palavra.charAt(0).toUpperCase() + palavra.slice(1)
      }

      wordIndex++
      return formatada
    })
    .join("")
}

/**
 * Converte uma string para Sentence case (Primeira letra maiúscula, resto minúscula).
 * Útil para labels e títulos.
 */
export function toSentenceCase(text: string): string {
  if (!text) return ""
  const clean = text.trim().toLowerCase()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/**
 * Busca endereço via API ViaCEP baseada em um CEP.
 */
export async function buscarEnderecoPorCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, "")
  if (cleanCep.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json()
    if (data.erro) return null
    
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error)
    return null
  }
}
