import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { useArgs } from '@storybook/preview-api';

import { SAUFilterModule } from '../lib/filter';

const meta: Meta<SAUFilterModule> = {
    title: 'Components/Filter',
    component: SAUFilterModule,
    decorators: [
        moduleMetadata({
            imports: [
                CommonModule,
                ReactiveFormsModule,
                SAUFilterModule
            ],
            providers: [
                DatePipe,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({}),
                        snapshot: { queryParams: {} }
                    }
                }
            ]
        })
    ],
    argTypes: {
        onFilterProcessed: { action: 'onFilterProcessed' }
    }
};

export default meta;
type Story = StoryObj<SAUFilterModule>;

const defaultFilterConfig = {
    order: ['buscar', 'estado', 'categorias', 'activo'],
    mobile: ['buscar', 'estado'],
    form: {
        buscar: {
            name: 'Buscar',
            key: 'search',
            type: 'inputText',
            defaultValue: ''
        },
        estado: {
            name: 'Estado',
            key: 'status_id',
            type: 'selectSimple',
            dropdowns: [
                { id: 1, name: 'Activo' },
                { id: 2, name: 'Inactivo' }
            ],
            defaultValue: '1'
        },
        categorias: {
            name: 'Categoría',
            key: 'categories',
            type: 'selectMultiple',
            dropdowns: [
                { id: 10, name: 'Tecnología' },
                { id: 20, name: 'Soporte' },
                { id: 30, name: 'Administración' }
            ],
            defaultValue: [10, 20]
        },
        activo: {
            name: 'Activo',
            key: 'is_active',
            type: 'inputCheckbox',
            defaultValue: true
        }
    }
};

export const Interactive: Story = {
    args: {
        searchButtonText: 'Buscar',
        filterConfig: {
            orderParamName: 'sort',
            orderByFields: [
                { field: 'title', label: 'Título' },
                { field: 'created_at', label: 'Fecha de Creación' },
                { field: 'total', label: 'Importe Total' }
            ],
            order: ['buscar', 'estado'],
            mobile: ['buscar'],
            form: {
                buscar: {
                    name: 'Buscar',
                    key: 'search',
                    type: 'inputText',
                    defaultValue: ''
                },
                estado: {
                    name: 'Estado',
                    key: 'status_id',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Activo' },
                        { id: 2, name: 'Inactivo' }
                    ],
                    defaultValue: ''
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Filtros procesados:', event);
                }
            }
        };
    }
};

export const SimpleSearch: Story = {
    args: {
        searchButtonText: 'Buscar',
        filterConfig: {
            order: ['search'],
            mobile: ['search'],
            form: {
                search: {
                    name: 'Buscar',
                    key: 'q',
                    type: 'inputText',
                    defaultValue: ''
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Filter Result:', event);
                }
            }
        };
    }
};

export const ManyFilters: Story = {
    args: {
        searchButtonText: 'Aplicar Filtros',
        filterConfig: {
            order: ['search', 'status', 'category', 'priority', 'assignee', 'date_from'],
            mobile: ['search', 'status'],
            form: {
                search: {
                    name: 'Búsqueda',
                    key: 'q',
                    type: 'inputText',
                    defaultValue: ''
                },
                status: {
                    name: 'Estado',
                    key: 'status_id',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Pendiente' },
                        { id: 2, name: 'En Progreso' },
                        { id: 3, name: 'Completado' },
                        { id: 4, name: 'Cancelado' }
                    ],
                    defaultValue: ''
                },
                category: {
                    name: 'Categoría',
                    key: 'categories',
                    type: 'selectMultiple',
                    dropdowns: [
                        { id: 10, name: 'Urgente' },
                        { id: 20, name: 'Normal' },
                        { id: 30, name: 'Baja Prioridad' }
                    ],
                    defaultValue: []
                },
                priority: {
                    name: 'Prioridad',
                    key: 'priority',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Alta' },
                        { id: 2, name: 'Media' },
                        { id: 3, name: 'Baja' }
                    ],
                    defaultValue: ''
                },
                assignee: {
                    name: 'Asignado a',
                    key: 'assignee_id',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Juan Pérez' },
                        { id: 2, name: 'María García' },
                        { id: 3, name: 'Carlos López' }
                    ],
                    defaultValue: ''
                },
                date_from: {
                    name: 'Fecha',
                    key: 'date_from',
                    type: 'date',
                    defaultValue: ''
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Generated URL:', event.url);
                }
            }
        };
    }
};

export const CustomerFilter: Story = {
    args: {
        searchButtonText: 'Filtrar',
        filterConfig: {
            order: ['nombre', 'empresa', 'estado', 'activo'],
            mobile: ['nombre', 'estado'],
            form: {
                nombre: {
                    name: 'Nombre',
                    key: 'name',
                    type: 'inputText',
                    defaultValue: ''
                },
                empresa: {
                    name: 'Empresa',
                    key: 'company_id',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Acme Corp', nif: 'ES12345678' },
                        { id: 2, name: 'Tech Solutions', nif: 'ES87654321' },
                        { id: 3, name: 'Global Industries', nif: 'ES11223344' }
                    ],
                    defaultValue: ''
                },
                estado: {
                    name: 'Estado',
                    key: 'status',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Activo' },
                        { id: 2, name: 'Inactivo' },
                        { id: 3, name: 'Suspendido' }
                    ],
                    defaultValue: '1'
                },
                activo: {
                    name: 'Premium',
                    key: 'is_premium',
                    type: 'inputCheckbox',
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                }
            }
        };
    }
};

export const ProductFilter: Story = {
    args: {
        searchButtonText: 'Buscar Productos',
        filterConfig: {
            order: ['productName', 'category', 'minPrice', 'maxPrice', 'inStock'],
            mobile: ['productName', 'category'],
            form: {
                productName: {
                    name: 'Producto',
                    key: 'product_name',
                    type: 'inputText',
                    defaultValue: ''
                },
                category: {
                    name: 'Categoría',
                    key: 'categories',
                    type: 'selectMultiple',
                    dropdowns: [
                        { id: 1, name: 'Electrónica' },
                        { id: 2, name: 'Ropa' },
                        { id: 3, name: 'Hogar' },
                        { id: 4, name: 'Deportes' }
                    ],
                    defaultValue: []
                },
                minPrice: {
                    name: 'Precio Mín.',
                    key: 'price_min',
                    type: 'inputNumber',
                    defaultValue: ''
                },
                maxPrice: {
                    name: 'Precio Máx.',
                    key: 'price_max',
                    type: 'inputNumber',
                    defaultValue: ''
                },
                inStock: {
                    name: 'En Stock',
                    key: 'in_stock',
                    type: 'inputCheckbox',
                    defaultValue: 0
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                }
            }
        };
    }
};

export const DateFilter: Story = {
    args: {
        searchButtonText: 'Filtrar',
        filterConfig: {
            order: ['search', 'date_field'],
            mobile: ['search', 'date_field'],
            form: {
                search: {
                    name: 'Búsqueda',
                    key: 'q',
                    type: 'inputText',
                    defaultValue: ''
                },
                date_field: {
                    name: 'Fecha',
                    key: 'date',
                    type: 'date',
                    defaultValue: ''
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Date Filter Result:', event.json);
                }
            }
        };
    }
};

export const DateRangeFilter: Story = {
    args: {
        searchButtonText: 'Filtrar Período',
        filterConfig: {
            order: ['periodo', 'status'],
            mobile: ['periodo', 'status'],
            form: {
                periodo: {
                    name: 'Período',
                    key: 'date_from',
                    keyTo: 'date_to',
                    type: 'dateRange',
                    defaultValue: []
                },
                status: {
                    name: 'Estado',
                    key: 'status_id',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Completado' },
                        { id: 2, name: 'Pendiente' },
                        { id: 3, name: 'Cancelado' }
                    ],
                    defaultValue: ''
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Date Range Filter Result:', event.json);
                    console.log('Generated URL:', event.url);
                }
            }
        };
    }
};

export const CompleteFilter: Story = {
    args: {
        searchButtonText: 'Buscar Reportes',
        filterConfig: {
            order: ['search', 'date_field', 'date_range', 'category', 'status'],
            mobile: ['search', 'date_field', 'date_range'],
            form: {
                search: {
                    name: 'Búsqueda',
                    key: 'q',
                    type: 'inputText',
                    defaultValue: ''
                },
                date_field: {
                    name: 'Fecha Inicio',
                    key: 'start_date',
                    type: 'date',
                    defaultValue: ''
                },
                date_range: {
                    name: 'Período de Análisis',
                    key: 'analysis_from',
                    keyTo: 'analysis_to',
                    type: 'dateRange',
                    defaultValue: []
                },
                category: {
                    name: 'Categoría',
                    key: 'categories',
                    type: 'selectMultiple',
                    dropdowns: [
                        { id: 1, name: 'Ventas' },
                        { id: 2, name: 'Gastos' },
                        { id: 3, name: 'Inventario' },
                        { id: 4, name: 'Personal' }
                    ],
                    defaultValue: []
                },
                status: {
                    name: 'Estado',
                    key: 'status',
                    type: 'selectSimple',
                    dropdowns: [
                        { id: 1, name: 'Activo' },
                        { id: 2, name: 'Inactivo' },
                        { id: 3, name: 'Archivado' }
                    ],
                    defaultValue: '1'
                }
            }
        }
    },
    render: (args) => {
        const [{ filterConfig }, updateArgs] = useArgs();
        return {
            props: {
                ...args,
                filterConfig,
                onFilterProcessed: (event: { json: any, url: string }) => {
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }
                    console.log('Complete Filter Result:', event.json);
                    console.log('Generated URL:', event.url);
                }
            }
        };
    }
};