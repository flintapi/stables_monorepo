'use client'

import { CornerRightUp } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { networkStore } from '@/lib/global-store'
import { cn } from '@/lib/utils'

interface AIInputProps {
  id?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onSubmit?: (value: string) => void
  className?: string
}

export function AddressInput({
  id = 'address-input',
  placeholder = 'Enter receiving address...',
  minHeight = 52,
  maxHeight = 200,
  onSubmit,
  className,
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  })
  const [inputValue, setInputValue] = useState<string>('')
  const NETWORKS = useStore(networkStore, (state) => state.NETWORKS)
  const selectedNetwork = useStore(networkStore, (state) => state.selected)
  const setNetwork = (value: string) => {
    networkStore.setState((state) => ({
      ...state,
      selected: state.NETWORKS.find((n) => n.label === value)?.label,
    }))
  }
  const resetSelectedNetwork = () =>
    networkStore.setState((state) => ({
      ...state,
      selected: undefined,
    }))

  const handleReset = () => {
    if (!inputValue.trim()) {
      return toast.warning('Please input an address', {
        description: 'Address is required to carry out the transaction',
      })
    }
    if (!selectedNetwork?.trim()) {
      return toast.warning('Please select a network', {
        description: 'A network is required to carry out the transaction',
      })
    }
    onSubmit?.(inputValue)
    setInputValue('')
    resetSelectedNetwork()
    adjustHeight(true)
  }

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="relative max-w-xl w-full">
        <Textarea
          id={id}
          placeholder={placeholder}
          className={cn(
            'max-w-xl w-full bg-black/5 dark:bg-white/5 rounded-3xl pl-6 pr-16',
            'placeholder:text-black/50 dark:placeholder:text-white/50',
            'border-none ring-black/20 dark:ring-white/20',
            'text-black dark:text-white text-wrap',
            'overflow-y-auto resize-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'transition-[height] duration-100 ease-out',
            'leading-[1.2] py-[16px]',
            `min-h-[${minHeight}px]`,
            `max-h-[${maxHeight}px]`,
            '[&::-webkit-resizer]:hidden', // Скрываем ресайзер
          )}
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            adjustHeight()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleReset()
            }
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2  bg-black/5 dark:bg-white/5 py-1 px-1 transition-all duration-200',
                inputValue ? 'right-10' : 'right-3',
                selectedNetwork
                  ? 'rounded-lg px-2 flex items-center justify-center hover:cursor-pointer'
                  : 'rounded-xl',
              )}
            >
              {selectedNetwork ? (
                <span className="text-xs font-semibold">{selectedNetwork}</span>
              ) : (
                // <Link2 className="w-4 h-4 text-black/70 dark:text-white/70" />
                <span>Select Chain</span>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Supported Network</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedNetwork}
              onValueChange={setNetwork}
            >
              {NETWORKS.map((item, index) => (
                <DropdownMenuRadioItem key={index} value={item.label}>
                  {item.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={handleReset} // TODO: server function call to make request
          type="button"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 right-3',
            'rounded-xl bg-black/5 dark:bg-red-400 py-1 px-1',
            'transition-all duration-200',
            inputValue
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-25 pointer-events-none',
          )}
        >
          <CornerRightUp className="w-4 h-4 text-black/70 dark:text-white/70" />
        </button>
      </div>
    </div>
  )
}
