"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { PopoverProps } from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface QuestionBankSelectorProps extends PopoverProps {
  questionBanks: any[]
  onSelect: (bank: any) => void
}

export function QuestionBankSelector({ questionBanks, onSelect, ...props }: QuestionBankSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedBank, setSelectedBank] = React.useState<any>()
  const router = useRouter()

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Load a question bank..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedBank ? selectedBank.name : "Load a question bank..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search question banks..." />
          <CommandList>
            <CommandEmpty>No question banks found.</CommandEmpty>
            <CommandGroup heading="Your Banks">
              {questionBanks.map((bank) => (
                <CommandItem
                  key={bank.id}
                  onSelect={() => {
                    setSelectedBank(bank)
                    onSelect(bank)
                    setOpen(false)
                  }}
                >
                  {bank.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedBank?.id === bank.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup className="pt-0">
              <CommandItem onSelect={() => router.push("/examples")}>
                More examples
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
