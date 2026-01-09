// ==========================================
// CONFIG LOADER
// ==========================================

let GeneticsConfig = null;

export async function loadGeneticsConfig() {
  if (GeneticsConfig) {
    return GeneticsConfig;
  }

  try {
    const response = await fetch('./genetics-config.json');
    const rawConfig = await response.json();
    
    // Normalize the config structure
    GeneticsConfig = {
      inheritanceProbabilities: rawConfig.inheritanceProbabilities,
      genes: {},
      stdDevInheritance: rawConfig.stdDevInheritance
    };

    // Process each gene
    for (const [key, geneConfig] of Object.entries(rawConfig.genes)) {
      const normalized = { ...geneConfig };
      
      // Normalize inheritance probabilities naming
      if (geneConfig.inheritProbabilities) {
        normalized.inheritProbs = geneConfig.inheritProbabilities;
      } else if (geneConfig.inheritProbs) {
        normalized.inheritProbs = geneConfig.inheritProbs;
      }
      
      // Normalize petalMode options: JSON uses "mode", code uses "value"
      if (key === 'petalMode' && normalized.options) {
        normalized.options = normalized.options.map(opt => ({
          value: opt.mode || opt.value,
          weight: opt.weight
        }));
      }
      
      // Normalize color genes structure
      if (geneConfig.type === 'color' && geneConfig.components) {
        // Convert components structure to initial/mutationStdDev structure
        normalized.initial = {
          L: geneConfig.components.L.initial,
          a: geneConfig.components.a.initial,
          b: geneConfig.components.b.initial
        };
        normalized.mutationStdDev = {
          L: geneConfig.components.L.mutationStdDev,
          a: geneConfig.components.a.mutationStdDev,
          b: geneConfig.components.b.mutationStdDev
        };
      }
      
      GeneticsConfig.genes[key] = normalized;
    }
    
    return GeneticsConfig;
  } catch (error) {
    console.error('Failed to load genetics config:', error);
    throw error;
  }
}

export function getGeneticsConfig() {
  if (!GeneticsConfig) {
    throw new Error('Genetics config not loaded. Call loadGeneticsConfig() first.');
  }
  return GeneticsConfig;
}

