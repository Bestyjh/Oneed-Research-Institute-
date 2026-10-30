import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders site header brand', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const brand = screen.getByText(/oneed institute/i);
  expect(brand).toBeInTheDocument();
});
