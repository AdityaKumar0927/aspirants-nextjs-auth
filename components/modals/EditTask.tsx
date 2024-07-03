"use client"
// src/components/EditTask.tsx
import { useEffect } from "react";
import { Flex, Modal, TextInput } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import Button from "@/components/planner/Button";

type EditTaskProps = {
  open: boolean;
  onClose: (value: boolean) => void;
  task: { text: string } | null;
  onTaskEdit: (text: string) => void;
};

const EditTask = ({ open, onClose, task, onTaskEdit }: EditTaskProps) => {
  const form = useForm({
    initialValues: {
      taskInput: task?.text || "",
    },
    validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: {
      taskInput: isNotEmpty("Task cannot be empty"),
    },
  });

  useEffect(() => {
    form.setValues({ taskInput: task?.text || "" });
  }, [task]);

  return (
    <Modal opened={open} onClose={() => onClose(false)} title="Edit task" centered>
      <form onSubmit={form.onSubmit(() => onTaskEdit(form.values.taskInput))}>
        <TextInput placeholder="Task" label="Task" mb={20} {...form.getInputProps("taskInput")} />
        <Flex justify="space-between" mt={50}>
          <Button variant="default" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="filled" color="green" disabled={!form.isValid()}>
            Edit
          </Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default EditTask;
