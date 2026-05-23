import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { useArgs } from '@storybook/preview-api';

// Importamos directamente tu Componente Standalone
import { SAUSelectorModule } from '../public-api';

const meta: Meta<SAUSelectorModule> = {
    title: 'Components/Selector',
    component: SAUSelectorModule,
    decorators: [
        moduleMetadata({
            imports: [
                CommonModule,
                ReactiveFormsModule,
                SAUSelectorModule // Al ser standalone, se importa en la metadata del módulo ficticio
            ],
            providers: [
                DatePipe,
                // Mock obligatorio de ActivatedRoute ya que el componente lo inyecta en el constructor
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
    // Declaramos los eventos en el panel de Actions de Storybook
    argTypes: {
        onFilterProcessed: { action: 'onFilterProcessed' }
    }
};

export default meta;
type Story = StoryObj<SAUSelectorModule>;

// Configuración de prueba dummy para renderizar varios tipos de inputs en la Story
const defaultSelectorConfig = {
    order: ['buscar', 'estado', 'categorias', 'activo'],
    mobile: ['buscar', 'estado'], // Filtros visibles en responsive por defecto
    form: {
        buscar: {
            name: 'Buscar',
            key: 'search',
            type: 'inputText', // Asumiendo que CustomInputComponent maneja esto
            defaultValue: ''
        },
        estado: {
            name: 'Estado',
            key: 'status_id',
            type: 'selectorSimple',
            dropdowns: [
                { id: 1, name: 'Activo' },
                { id: 2, name: 'Inactivo' }
            ],
            defaultValue: '1' // Pasará por convertToNumberFilter convirtiéndose en 1 nativo
        },
        categorias: {
            name: 'Categoría',
            key: 'categories',
            type: 'selectorMultiple',
            dropdowns: [
                { id: 10, name: 'Tecnología' },
                { id: 20, name: 'Soporte' },
                { id: 30, name: 'Administración' }
            ],
            defaultValue: [10, 20] // Se parseará a un array numérico [10, 20]
        },
        activo: {
            name: 'Activo',
            key: 'is_active',
            type: 'inputCheckbox',
            defaultValue: 0
        }
    }
};

export const Interactive: Story = {
    args: {
        searchButtonText: 'Search',
        selectorConfig: defaultSelectorConfig
    },
    render: (args) => {
        // Usamos useArgs para poder capturar los cambios y mantener vivo el estado en la interfaz
        const [{ selectorConfig }, updateArgs] = useArgs();

        return {
            props: {
                ...args,
                selectorConfig,
                // Capturamos el Output del componente cuando se procesan los filtros
                onFilterProcessed: (event: { json: any, url: string }) => {
                    // 1. Imprime el resultado en tiempo real en la consola de Actions de Storybook
                    if (args['onFilterProcessed']) {
                        args['onFilterProcessed'](event);
                    }

                    // 2. Si quisieras mutar dinámicamente alguna propiedad del config basada en la respuesta,
                    // podrías usar updateArgs aquí. Por ejemplo:
                    // updateArgs({ selectorConfig: { ...selectorConfig, ultimoFiltro: event.json } });
                }
            }
        };
    }
};