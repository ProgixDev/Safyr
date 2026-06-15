"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { JobApplication } from "@/lib/types";
import { EMPLOYEE_POSTE_OPTIONS } from "@/lib/hr-options";

const commonPositions = EMPLOYEE_POSTE_OPTIONS;

export default function NewApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    phone: "",
    position: "",
    customPosition: "",
    notes: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: "cv" | "coverLetter", file: File | null) => {
    if (field === "cv") {
      setCvFile(file);
    } else {
      setCoverLetterFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would upload files and create the application
      const newApplication: JobApplication = {
        id: Date.now().toString(), // Mock ID
        applicantName: formData.applicantName,
        email: formData.email,
        phone: formData.phone,
        position:
          formData.position === "Autre"
            ? formData.customPosition
            : formData.position,
        cv: cvFile ? `/files/cv_${Date.now()}.pdf` : undefined, // Mock URL
        coverLetter: coverLetterFile
          ? `/files/lettre_${Date.now()}.pdf`
          : undefined, // Mock URL
        status: "pending",
        appliedAt: new Date(),
        notes: formData.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock API call - in real app, send to backend
      console.log("Creating application:", newApplication);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect back to applications list
      router.push("/dashboard/hr/lifecycle/recruitment/applications");
    } catch (error) {
      console.error("Error creating application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.applicantName &&
    formData.email &&
    formData.phone &&
    (formData.position !== "Autre"
      ? formData.position
      : formData.customPosition);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Nouvelle candidature
          </h1>
          <p className="text-muted-foreground">
            Ajouter une nouvelle candidature à la plateforme
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du candidat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Nom du candidat *</Label>
                <Input
                  id="applicantName"
                  value={formData.applicantName}
                  onChange={(e) =>
                    handleInputChange("applicantName", e.target.value)
                  }
                  placeholder="Ex: Marie Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="marie.dupont@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste demandé *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) =>
                    handleInputChange("position", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonPositions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.position === "Autre" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customPosition">Préciser le poste *</Label>
                  <Input
                    id="customPosition"
                    value={formData.customPosition}
                    onChange={(e) =>
                      handleInputChange("customPosition", e.target.value)
                    }
                    placeholder="Ex: Responsable sécurité événementielle"
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv">CV</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) =>
                      handleFileChange("cv", e.target.files?.[0] || null)
                    }
                    className="flex-1"
                  />
                  {cvFile && (
                    <span className="text-sm text-muted-foreground">
                      {cvFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: PDF, DOC, DOCX (max 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Lettre de motivation</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="coverLetter"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) =>
                      handleFileChange(
                        "coverLetter",
                        e.target.files?.[0] || null,
                      )
                    }
                    className="flex-1"
                  />
                  {coverLetterFile && (
                    <span className="text-sm text-muted-foreground">
                      {coverLetterFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: PDF, DOC, DOCX (max 10MB)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Informations supplémentaires sur le candidat..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={!isFormValid || isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Création..." : "Créer la candidature"}
          </Button>
        </div>
      </form>
    </div>
  );
}
