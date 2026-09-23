import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('默认渲染为原生 button，并带 data-slot / 默认变体标记', () => {
    render(<Button>点击</Button>);
    const btn = screen.getByRole('button', { name: '点击' });

    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('data-slot', 'button');
    expect(btn).toHaveAttribute('data-variant', 'default');
    expect(btn).toHaveAttribute('data-size', 'default');
  });

  it('variant 与 size 会输出对应的 Tailwind 类', () => {
    render(
      <Button variant="destructive" size="lg">
        删除
      </Button>,
    );
    const btn = screen.getByRole('button', { name: '删除' });

    expect(btn.className).toContain('bg-destructive');
    expect(btn.className).toContain('h-10');
  });

  it('size=icon 输出正方形尺寸，且不带水平内边距', () => {
    render(
      <Button size="icon" aria-label="图标按钮">
        <span />
      </Button>,
    );
    const btn = screen.getByRole('button', { name: '图标按钮' });

    expect(btn.className).toContain('size-9');
    expect(btn.className).not.toContain('px-4');
  });

  it('render 时把样式与属性合并到子元素，不再渲染 button', () => {
    render(<Button render={<a href="/x">链接</a>} />);
    const link = screen.getByRole('link', { name: '链接' });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link.className).toContain('bg-primary');
  });

  it('可点击并触发 onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>提交</Button>);

    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 时不触发 onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        禁用
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: '禁用' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('自定义 className 与变体类共存（cn 合并生效）', () => {
    render(<Button className="w-full">宽按钮</Button>);
    const btn = screen.getByRole('button', { name: '宽按钮' });

    expect(btn.className).toContain('w-full');
    expect(btn.className).toContain('inline-flex');
  });
});
