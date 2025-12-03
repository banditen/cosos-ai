"use client"

import * as React from "react"
import Image from "next/image"
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  PlugIcon,
  BotIcon,
  SettingsIcon,
  HelpCircleIcon,
  FileIcon,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface Agent {
  id: string
  name: string
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [agents, setAgents] = React.useState<Agent[]>([])

  const loadAgents = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // TODO: Replace with actual agents API when implemented
      // const data = await apiClient.agents.list(user.id)
      // setAgents(data.agents || [])
      setAgents([])
    } catch (error) {
      console.error('Error loading agents for sidebar:', error)
    }
  }, [])

  React.useEffect(() => {
    loadAgents()

    // Listen for agent changes
    const handleAgentChange = () => {
      loadAgents()
    }

    window.addEventListener('agentChanged', handleAgentChange)

    return () => {
      window.removeEventListener('agentChanged', handleAgentChange)
    }
  }, [loadAgents])

  const navMain = [
    {
      title: "Home",
      url: "/home",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: BookOpenIcon,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: PlugIcon,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: BotIcon,
      items: agents.map(agent => ({
        title: agent.name,
        url: `/agents/${agent.id}`,
        icon: FileIcon,
      })),
    },
  ]

  const navSecondary = [
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: HelpCircleIcon,
    },
  ]

  const { toggleSidebar, open } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 flex-1"
              >
                <a href="/home">
                  <Image
                    src="/logo.png"
                    alt="Cosos"
                    width={100}
                    height={32}
                    className="object-contain"
                    priority
                  />
                </a>
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-7 w-7 shrink-0"
              >
                {open ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
