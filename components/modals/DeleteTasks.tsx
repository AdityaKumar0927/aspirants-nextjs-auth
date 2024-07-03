"use client";

// src/components/DeleteTasks.tsx
import { useState } from "react";
import { Flex, Modal, Text, Tooltip } from "@mantine/core";
import { IconTrashX } from "@tabler/icons-react";
import Action from "@/components/planner/Action";
import Button from "@/components/planner/Button";

type DeleteTasksProps = {
  onDeleteTasks: () => void;
};

const DeleteTasks = ({ onDeleteTasks }: DeleteTasksProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Tooltip label="Delete all tasks">
        <Action
          color="red"
          variant="light"
          aria-label="Delete all tasks"
          onClick={() => setOpened(true)}
        >
          <IconTrashX size={18} />
        </Action>
      </Tooltip>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Delete all tasks" centered>
        <Text component="p" fz={14}>
          Are you sure you want to delete all tasks?
        </Text>
        <Flex justify="space-between" mt={50}>
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDeleteTasks();
              setOpened(false);
            }}
            color="red"
            variant="filled"
          >
            Delete
          </Button>
        </Flex>
      </Modal>
    </>
  );
};

export default DeleteTasks;
