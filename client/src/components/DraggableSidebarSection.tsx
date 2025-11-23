import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { UserRole } from "./AppSidebar";

type MenuItem = {
  titleKey: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
};

type DraggableSidebarSectionProps = {
  items: MenuItem[];
  userRole: UserRole | undefined;
  children: (orderedItems: MenuItem[]) => React.ReactNode;
};

const STORAGE_KEY_PREFIX = "external-sidebar-order";

// Debounce function for localStorage writes
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function getSortedItems(
  items: MenuItem[],
  storedOrder: string[] | null
): MenuItem[] {
  if (!storedOrder || storedOrder.length === 0) {
    return items;
  }

  // Create a map of titleKey -> item for fast lookup
  const itemMap = new Map<string, MenuItem>();
  items.forEach((item) => itemMap.set(item.titleKey, item));

  // Build ordered array based on stored order
  const orderedItems: MenuItem[] = [];
  const seenKeys = new Set<string>();

  // First, add items in stored order
  storedOrder.forEach((key) => {
    const item = itemMap.get(key);
    if (item) {
      orderedItems.push(item);
      seenKeys.add(key);
    }
  });

  // Then add any new items that aren't in stored order (at the end)
  items.forEach((item) => {
    if (!seenKeys.has(item.titleKey)) {
      orderedItems.push(item);
    }
  });

  return orderedItems;
}

export function SortableMenuItem({
  item,
  children,
}: {
  item: MenuItem;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.titleKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      className="group/menu-item relative"
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Drag to reorder ${item.titleKey}`}
        className="absolute -left-5 top-0 bottom-0 my-auto h-fit hidden group-hover/menu-item:block focus-visible:block cursor-grab active:cursor-grabbing p-1 hover-elevate active-elevate-2 rounded-md z-10 focus-visible:ring-2 focus-visible:ring-primary"
        data-testid={`drag-handle-${item.titleKey}`}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </li>
  );
}

export function SortableMenuSubItem({
  item,
  children,
}: {
  item: MenuItem;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.titleKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      className="group/menu-sub-item relative"
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Drag to reorder ${item.titleKey}`}
        className="absolute -left-5 top-0 bottom-0 my-auto h-fit hidden group-hover/menu-sub-item:block focus-visible:block cursor-grab active:cursor-grabbing p-1 hover-elevate active-elevate-2 rounded-md z-10 focus-visible:ring-2 focus-visible:ring-primary"
        data-testid={`drag-handle-${item.titleKey}`}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </li>
  );
}

export function DraggableSidebarSection({
  items,
  userRole,
  children,
}: DraggableSidebarSectionProps) {
  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}:${userRole}`,
    [userRole]
  );

  const [orderedItems, setOrderedItems] = useState<MenuItem[]>(items);

  // Load order from localStorage on mount or when userRole changes
  useEffect(() => {
    if (!userRole) {
      setOrderedItems(items);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const storedOrder = JSON.parse(stored) as string[];
        setOrderedItems(getSortedItems(items, storedOrder));
      } else {
        setOrderedItems(items);
      }
    } catch (error) {
      console.error("Error loading sidebar order from localStorage:", error);
      setOrderedItems(items);
    }
  }, [items, userRole, storageKey]);

  // Debounced function to save order to localStorage
  const saveOrderToLocalStorage = useMemo(
    () =>
      debounce((order: string[]) => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(order));
        } catch (error) {
          console.error("Error saving sidebar order to localStorage:", error);
        }
      }, 500),
    [storageKey]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setOrderedItems((items) => {
          const oldIndex = items.findIndex(
            (item) => item.titleKey === active.id
          );
          const newIndex = items.findIndex((item) => item.titleKey === over.id);

          const newOrder = arrayMove(items, oldIndex, newIndex);
          
          // Save new order to localStorage (debounced)
          const orderKeys = newOrder.map((item) => item.titleKey);
          saveOrderToLocalStorage(orderKeys);

          return newOrder;
        });
      }
    },
    [saveOrderToLocalStorage]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedItems.map((item) => item.titleKey)}
        strategy={verticalListSortingStrategy}
      >
        {children(orderedItems)}
      </SortableContext>
    </DndContext>
  );
}
