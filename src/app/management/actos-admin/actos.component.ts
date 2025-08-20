import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/select';
import { HttpClientModule } from '@angular/common/http';
import { ActoAdministrativoService } from '../../Services/acto-administrativo.service';
import { ActoAdministrativoDTO } from '../../Models/acto-administrativo-dto';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';
import { NuMonacoEditorComponent } from '@ng-util/monaco-editor';
 
  @Component({
  selector:  'app-actos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule, MatSelect, MatOption,
    MatIconModule,
    MatDividerModule,
    HttpClientModule,
    NuMonacoEditorModule
  ],
  templateUrl: './actos.component.html',
  styleUrls: ['./actos.component.scss']
})
export class ActosComponent implements OnInit {
  actoForm: FormGroup;
  editingId: number | null = null;
  actos: ActoAdministrativoDTO[] = [];
  deletedActos: ActoAdministrativoDTO[] = [];
  private editorDecorations: string[] = [];

  editorOptions = {
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: false },
  wordWrap: 'on',
  lineNumbers: 'on',
  automaticLayout: true,
  readOnly: false
};
  roles = [
    { value: 'conseller', viewValue: 'Conseller' },
    { value: 'ceo', viewValue: 'CEO' },
    { value: 'technician', viewValue: 'Técnica/o' },
  ];

  @ViewChild('editorRef') editorComponent!: NuMonacoEditorComponent;
  ngAfterViewInit(): void {
    const editor = this.editorComponent.editor;
    if (editor) {
      console.log('Editor cargado:', editor);

      // aplicar decoraciones, opciones, etc.
      editor.updateOptions({ automaticLayout: true });
    }
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private actoService: ActoAdministrativoService,
    private route: ActivatedRoute
  ) {
    this.actoForm = this.fb.group({
      denominacion: [{value:'', disabled: true}, [Validators.required, Validators.maxLength(100)]],
      tipo_tramite: [{value:'', disabled: true},, [Validators.required, Validators.maxLength(20)]],
      texto: ['', Validators.required],
      texto_es: ['', Validators.required],
      signedBy: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editingId = id;
      this.actoService.getById(id).subscribe(acto => {
        if (acto) {
          this.actoForm.patchValue(acto);
        }
      });
    }

    this.loadActos();
    this.loadDeletedActos();
  }

  loadActos(): void {
    this.actoService.getAll().subscribe(data => this.actos = data);
  }

  loadDeletedActos(): void {
    this.actoService.getDeleted().subscribe(data => this.deletedActos = data);
  }

  onSubmit(): void {
    if (this.actoForm.invalid) return;
    const data = this.actoForm.value;

    if (this.editingId) {
      this.actoService.update(this.editingId, data).subscribe(() => {
        this.loadActos();
        this.cancelEdit();
      });
    } else {
      this.actoService.create(data).subscribe(() => {
        this.loadActos();
        this.actoForm.reset();
      });
    }
  }

  edit(acto: ActoAdministrativoDTO): void {
    this.editingId = acto.id!;
    this.actoForm.patchValue(acto);
  }

  cancelEdit(): void {
    this.editingId = null;
    this.actoForm.reset();
    this.router.navigate(['/actos-admin-list']); 
  }

  delete(id: number): void {
    this.actoService.delete(id).subscribe(() => {
      this.loadActos();
      this.loadDeletedActos();
    });
  }

  restore(id: number): void {
    this.actoService.restore(id).subscribe(() => {
      this.loadActos();
      this.loadDeletedActos();
    });
  }


onEditorInit(editor: any):void {
  console.log ("editor: ", editor)
  const model = editor.getModel();

  const applyHighlighting = () => {
    if (!model) return;

    const text = model.getValue();
    const regex = /%([^%]+)%/g;
    const matches = [...text.matchAll(regex)];

    const decorations = matches.map(match => {
      const start = model.getPositionAt(match.index!);
      const end = model.getPositionAt(match.index! + match[0].length);
      return {
        range: new monaco.Range(
          start.lineNumber,
          start.column,
          end.lineNumber,
          end.column
        ),
        options: {
          inlineClassName: 'highlighted-variable'
        }
      };
    });

    this.editorDecorations = editor.deltaDecorations(this.editorDecorations, decorations);
  };

  applyHighlighting();

  model?.onDidChangeContent(() => {
    applyHighlighting();
  });
}

}
