const poke_container = document.getElementById('poke-container');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const progressEl = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const clearFiltersBtn = document.getElementById('clear-filters');
const modal = document.getElementById('pokemon-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close-modal');
const retryBtn = document.getElementById('retry-btn');

const pokemon_count = 1025; // Total de Pokémon na API (ajustado para incluir os mais recentes)
let allPokemon = []; // Cache dos resultados
let filteredPokemon = [];
let types = new Set();

const colors = {
    fire: '#FDDFDF',
    grass: '#DEFDE0',
    electric: '#FCF7DE',
    water: '#DEF3FD',
    ground: '#f4e7da',
    rock: '#d5d5d4',
    fairy: '#fceaff',
    poison: '#98d7a5',
    bug: '#f8d5a3',
    dragon: '#97b3e6',
    psychic: '#eaeda1',
    flying: '#F5F5F5',
    fighting: '#E6E0D4',
    normal: '#F5F5F5',
    ice: '#e0f5ff',
    ghost: '#ab9ac0',
    dark: '#a9a9a9',
    steel: '#d3d3d3'
};

// Carregamento paralelo com Promise.all
const fetchPokemons = async () => {
    try {
        showLoading(true);
        hideError();

        const pokemonPromises = [];

        for (let i = 1; i <= pokemon_count; i++) {
            pokemonPromises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
                .then(res => res.json()));

            // Atualiza progresso
            updateProgress(i, pokemon_count);
        }

        // Carrega todos em paralelo
        const results = await Promise.all(pokemonPromises);

        // Processa e cacheia os resultados
        allPokemon = results.map(pokemon => processPokemonData(pokemon));

        // Coleta todos os tipos únicos
        collectTypes();

        // Popula o filtro de tipos
        populateTypeFilter();

        // Inicializa com todos os Pokémon
        filteredPokemon = [...allPokemon];

        // Renderiza
        renderPokemon(filteredPokemon);

        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar Pokémon:', error);
        showLoading(false);
        showError();
    }
};

// Processa os dados do Pokémon para o formato que precisamos
const processPokemonData = (pokemon) => {
    const types = pokemon.types.map(type => type.type.name);
    const mainType = types.find(type => colors[type]) || types[0];

    return {
        id: pokemon.id,
        name: pokemon.name[0].toUpperCase() + pokemon.name.slice(1),
        formattedId: pokemon.id.toString().padStart(3, '0'),
        types: types,
        mainType: mainType,
        color: colors[mainType] || '#F5F5F5',
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`,
        height: pokemon.height / 10, // Converte para metros
        weight: pokemon.weight / 10, // Converte para kg
        stats: pokemon.stats.map(stat => ({
            name: stat.stat.name,
            value: stat.base_stat
        })),
        abilities: pokemon.abilities.map(ability => ability.ability.name)
    };
};

// Coleta todos os tipos únicos
const collectTypes = () => {
    types.clear();
    allPokemon.forEach(pokemon => {
        pokemon.types.forEach(type => types.add(type));
    });
};

// Popula o select de filtro de tipos
const populateTypeFilter = () => {
    const sortedTypes = Array.from(types).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeFilter.appendChild(option);
    });
};

// Renderiza os Pokémon com base nos filtros
const renderPokemon = (pokemonList) => {
    poke_container.innerHTML = '';

    if (pokemonList.length === 0) {
        poke_container.innerHTML = '<div class="no-results">Nenhum Pokémon encontrado</div>';
        return;
    }

    pokemonList.forEach(pokemon => createPokemonCard(pokemon));
};

// Cria o card do Pokémon
const createPokemonCard = (pokemon) => {
    const pokemonEl = document.createElement('div');
    pokemonEl.classList.add('pokemon');
    pokemonEl.style.backgroundColor = pokemon.color;

    pokemonEl.innerHTML = `
        <div class="img-container">
            <img src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy">
        </div>
        <div class="info">
            <span class="number">#${pokemon.formattedId}</span>
            <h3 class="name">${pokemon.name}</h3>
            <small class="type">Type: <span>${pokemon.mainType}</span></small>
        </div>
    `;

    // Adiciona evento de clique para mostrar detalhes
    pokemonEl.addEventListener('click', () => showPokemonDetails(pokemon));

    poke_container.appendChild(pokemonEl);
};

// Mostra detalhes do Pokémon no modal
const showPokemonDetails = (pokemon) => {
    const typesHtml = pokemon.types.map(type =>
        `<span class="type-badge" style="background-color: ${colors[type]}; color: #333;">${type}</span>`
    ).join('');

    const statsHtml = pokemon.stats.map(stat => `
        <div class="stat-bar">
            <div class="stat-label">
                <span>${stat.name}</span>
                <span>${stat.value}</span>
            </div>
            <div class="stat-progress">
                <div class="stat-fill" style="width: ${(stat.value / 255) * 100}%"></div>
            </div>
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div class="modal-pokemon">
            <div class="modal-img-container">
                <img src="${pokemon.image}" alt="${pokemon.name}">
            </div>
            <h2>${pokemon.name}</h2>
            <div class="modal-number">#${pokemon.formattedId}</div>
            <div class="modal-types">
                ${typesHtml}
            </div>
            <div class="modal-stats">
                <h3>Estatísticas Base</h3>
                ${statsHtml}
            </div>
            <div class="modal-info">
                <div class="info-item">
                    <span class="info-label">Altura</span>
                    <span class="info-value">${pokemon.height}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Peso</span>
                    <span class="info-value">${pokemon.weight}kg</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Habilidades</span>
                    <span class="info-value">${pokemon.abilities.join(', ')}</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
};

// Atualiza a barra de progresso
const updateProgress = (current, total) => {
    const percentage = (current / total) * 100;
    progressEl.style.width = `${percentage}%`;
    progressText.textContent = `${current}/${total}`;
};

// Funções de filtro e busca
const filterPokemon = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;

    filteredPokemon = allPokemon.filter(pokemon => {
        // Filtro de busca por nome ou número
        const matchesSearch = searchTerm === '' ||
            pokemon.name.toLowerCase().includes(searchTerm) ||
            pokemon.formattedId.includes(searchTerm) ||
            pokemon.id.toString() === searchTerm;

        // Filtro por tipo
        const matchesType = selectedType === 'all' ||
            pokemon.types.includes(selectedType);

        return matchesSearch && matchesType;
    });

    renderPokemon(filteredPokemon);
};

// Debounce para busca (evita muitas renderizações enquanto digita)
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

// UI Helpers
const showLoading = (show) => {
    if (show) {
        loadingEl.classList.remove('hidden');
        poke_container.classList.add('hidden');
    } else {
        loadingEl.classList.add('hidden');
        poke_container.classList.remove('hidden');
    }
};

const showError = () => {
    errorEl.classList.remove('hidden');
    poke_container.classList.add('hidden');
};

const hideError = () => {
    errorEl.classList.add('hidden');
};

const clearFilters = () => {
    searchInput.value = '';
    typeFilter.value = 'all';
    filteredPokemon = [...allPokemon];
    renderPokemon(filteredPokemon);
};

// Event Listeners
searchInput.addEventListener('input', debounce(filterPokemon, 300));
typeFilter.addEventListener('change', filterPokemon);
clearFiltersBtn.addEventListener('click', clearFilters);
retryBtn.addEventListener('click', fetchPokemons);

// Fechar modal
closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchPokemons();
});