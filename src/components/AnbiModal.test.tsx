import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnbiModal } from './AnbiModal';
import { AnbiOrganisation } from '../services/anbi';

// Mock motion/react to avoid animation-related issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockOrganisations: AnbiOrganisation[] = [
  {
    dossierNummer: 1,
    naam: 'Stichting Charity A',
    fiscaalNummer: 123456789,
    vestigingsPlaats: 'Amsterdam',
  },
  {
    dossierNummer: 2,
    naam: 'Helping Hands',
    fiscaalNummer: 987654321,
    vestigingsPlaats: 'Utrecht',
  },
];

describe('AnbiModal', () => {
  const onClose = vi.fn();
  const onSelect = vi.fn();

  it('does not render when closed', () => {
    render(
      <AnbiModal
        isOpen={false}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open and shows initial message', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Search for an ANBI')).toBeInTheDocument();
    expect(
      screen.getByText('Type at least 2 characters to see results'),
    ).toBeInTheDocument();
  });

  it('filters organisations by name', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );

    const input = screen.getByPlaceholderText('Search for an ANBI...');
    fireEvent.change(input, { target: { value: 'Charity' } });

    expect(screen.getByText('Stichting Charity A')).toBeInTheDocument();
    expect(screen.queryByText('Helping Hands')).not.toBeInTheDocument();
  });

  it('filters organisations by RSIN (fiscaalNummer)', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );

    const input = screen.getByPlaceholderText('Search for an ANBI...');
    fireEvent.change(input, { target: { value: '987654321' } });

    expect(screen.getByText('Helping Hands')).toBeInTheDocument();
    expect(screen.queryByText('Stichting Charity A')).not.toBeInTheDocument();
  });

  it('shows empty state when no results found', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );

    const input = screen.getByPlaceholderText('Search for an ANBI...');
    fireEvent.change(input, { target: { value: 'NonExistent' } });

    expect(screen.getByText('No organizations found')).toBeInTheDocument();
  });

  it('calls onSelect when an organisation is clicked', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );

    const input = screen.getByPlaceholderText('Search for an ANBI...');
    fireEvent.change(input, { target: { value: 'Charity' } });

    const option = screen.getByText('Stichting Charity A');
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(mockOrganisations[0]);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AnbiModal
        isOpen={true}
        onClose={onClose}
        onSelect={onSelect}
        anbiOrganisations={mockOrganisations}
      />,
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
