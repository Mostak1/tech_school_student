import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { success, error } from "@/components/lib/toast";

// Mock API functions for courses
const coursesAPI = {
  getCourses: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      {
        id: "1",
        title: "Mathematics 101",
        description: "Basic mathematics course",
        instructor: "Dr. Smith",
        duration: "12 weeks",
        price: 299,
        enrolled: 45,
        rating: 4.8,
      },
      {
        id: "2",
        title: "Physics Fundamentals",
        description: "Introduction to physics concepts",
        instructor: "Prof. Johnson",
        duration: "10 weeks",
        price: 349,
        enrolled: 32,
        rating: 4.6,
      },
      {
        id: "3",
        title: "Chemistry Basics",
        description: "Basic chemistry principles",
        instructor: "Dr. Brown",
        duration: "8 weeks",
        price: 279,
        enrolled: 28,
        rating: 4.7,
      },
    ];
  },

  getCourse: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const courses = await coursesAPI.getCourses();
    const course = courses.find((c) => c.id === id);
    if (!course) throw new Error("Course not found");
    return course;
  },

  enrollCourse: async (courseId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { success: true, enrollmentId: `enroll_${courseId}_${Date.now()}` };
  },
};

// Query keys
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: string) => [...courseKeys.lists(), { filters }] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

// Hook for fetching all courses
export const useCoursesQuery = () => {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: coursesAPI.getCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching a single course
export const useCourseQuery = (id: string) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesAPI.getCourse(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for enrolling in a course
export const useEnrollCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => coursesAPI.enrollCourse(courseId),
    onSuccess: (data, courseId) => {
      // Invalidate courses list to refresh enrollment counts
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

      // Update specific course detail
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });

      success("Successfully enrolled in course!");
    },
    onError: (err) => {
      error(err.message || "Failed to enroll in course");
    },
  });
};
