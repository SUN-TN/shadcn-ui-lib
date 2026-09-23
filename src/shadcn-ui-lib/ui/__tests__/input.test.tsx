import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('渲染原生 input 并带 data-slot', () => {
    render(<Input placeholder="请输入" />);
    const input = screen.getByPlaceholderText('请输入');

    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('可以正常输入', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="用户名" />);
    const input = screen.getByPlaceholderText('用户名');

    await user.type(input, 'shadcn');

    expect(input).toHaveValue('shadcn');
  });

  it('onChange 随输入触发', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="搜索" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('搜索'), 'ab');

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('disabled 时不接受输入', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="禁用" disabled />);
    const input = screen.getByPlaceholderText('禁用');

    await user.type(input, 'x');

    expect(input).toHaveValue('');
    expect(input).toBeDisabled();
  });

  it('aria-invalid 透传到原生属性', () => {
    render(<Input placeholder="邮箱" aria-invalid />);

    expect(screen.getByPlaceholderText('邮箱')).toHaveAttribute('aria-invalid', 'true');
  });

  it('type 透传到原生 input', () => {
    render(<Input type="password" placeholder="密码" />);
    const input = screen.getByPlaceholderText('密码');

    expect(input).toHaveAttribute('type', 'password');
  });

  it('自定义 className 与内置类共存（cn 合并生效）', () => {
    render(<Input placeholder="自定义" className="max-w-64" />);
    const input = screen.getByPlaceholderText('自定义');

    expect(input.className).toContain('max-w-64');
    expect(input.className).toContain('rounded-md');
  });
});
