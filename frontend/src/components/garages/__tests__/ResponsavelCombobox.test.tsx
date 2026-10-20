import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsavelCombobox } from '../ResponsavelCombobox';
import { Employee } from '@/services/employeeService';

const employees = [
  { id: 'e1', name: 'EDIVAINE DIONISIO DA SILVA', positionDescription: 'AUXILIAR ADMINISTRATIVO', registrationNumber: '1001', phone: '(11) 99999-0001' },
  { id: 'e2', name: 'EDIVALDO PEREIRA SOUZA', positionDescription: 'MOTORISTA', registrationNumber: '1002', phone: '(11) 99999-0002' },
  { id: 'e3', name: 'MARIA APARECIDA SOUZA', positionDescription: 'ENCARREGADA', registrationNumber: '1003', phone: '(11) 99999-0003' },
] as unknown as Employee[];

describe('ResponsavelCombobox', () => {
  it('pede 3 caracteres antes de exibir registros', () => {
    render(
      <ResponsavelCombobox employees={employees} value="" name="" onSelect={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ed' } });

    expect(screen.queryByText('EDIVAINE DIONISIO DA SILVA')).not.toBeInTheDocument();
    expect(screen.getByText(/Digite os 3 primeiros caracteres do nome para buscar/i)).toBeInTheDocument();
  });

  it('exibe os registros relacionados ao digitar os 3 primeiros caracteres (ignorando acentos)', () => {
    render(
      <ResponsavelCombobox employees={employees} value="" name="" onSelect={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'EDI' } });

    expect(screen.getByText('EDIVAINE DIONISIO DA SILVA')).toBeInTheDocument();
    expect(screen.getByText('EDIVALDO PEREIRA SOUZA')).toBeInTheDocument();
    expect(screen.queryByText('MARIA APARECIDA SOUZA')).not.toBeInTheDocument();
  });

  it('seleciona o funcionário ao clicar no registro', () => {
    const onSelect = jest.fn();
    render(
      <ResponsavelCombobox employees={employees} value="" name="" onSelect={onSelect} />
    );

    const input = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mari' } });
    fireEvent.click(screen.getByText('MARIA APARECIDA SOUZA'));

    expect(onSelect).toHaveBeenCalledWith(employees[2]);
  });

  it('seleciona o primeiro resultado ao pressionar Enter', () => {
    const onSelect = jest.fn();
    render(
      <ResponsavelCombobox employees={employees} value="" name="" onSelect={onSelect} />
    );

    const input = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'edi' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(employees[0]);
  });

  it('mostra a mensagem quando não encontra funcionário', () => {
    render(
      <ResponsavelCombobox employees={employees} value="" name="" onSelect={jest.fn()} />
    );

    const input = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzz' } });

    expect(screen.getByText(/Nenhum funcionário encontrado para "zzz"/i)).toBeInTheDocument();
  });

  it('exibe o responsável selecionado e permite limpá-lo', () => {
    const onSelect = jest.fn();
    render(
      <ResponsavelCombobox
        employees={employees}
        value="e1"
        name="EDIVAINE DIONISIO DA SILVA"
        onSelect={onSelect}
      />
    );

    // Nome do responsável aparece no campo (placeholder) e no resumo abaixo
    const input = screen.getByPlaceholderText('EDIVAINE DIONISIO DA SILVA');
    expect(screen.getByText('EDIVAINE DIONISIO DA SILVA')).toBeInTheDocument();
    expect(screen.getByText(/AUXILIAR ADMINISTRATIVO/)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Limpar responsável'));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(input).toHaveValue('');
  });
});
